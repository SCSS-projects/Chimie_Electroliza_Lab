import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, Button, StyleSheet, Dimensions, ScrollView, Animated 
} from 'react-native';
import Slider from '@react-native-community/slider';
import { LineChart } from 'react-native-chart-kit';
import TheoreticalGuide from './TheoreticalGuide';

interface Bubble {
  id: number;
  left: number; // Horizontal position within a glass as percentage (0–100)
  side: 'left' | 'right'; // Indicates which glass the bubble appears in
}

interface ExperimentationScreenProps {
  onBack: () => void;
}

//
// FloatingBubble component: animates upward (to the water’s surface) and fades out.
//
const FloatingBubble: React.FC<{ left: number }> = ({ left }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  
  // Each glass is about half the container width.
  const containerWidth = (Dimensions.get('window').width - 20) / 2;
  const pixelLeft = (left / 100) * containerWidth;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -150, // Bubble travels upward by 150 pixels
        duration: 3000,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 3000,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateY, opacity]);

  return (
    <Animated.View
      style={[
        styles.bubble,
        {
          left: pixelLeft,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    />
  );
};

const ExperimentationScreen: React.FC<ExperimentationScreenProps> = ({ onBack }) => {
  const [voltage, setVoltage] = useState<number>(5);
  const [current, setCurrent] = useState<number>(0.5);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  
  // Data tracking for the graph.
  const [time, setTime] = useState<number>(0);
  const [hydrogenData, setHydrogenData] = useState<number[]>([]);
  const [oxygenData, setOxygenData] = useState<number[]>([]);

  // Production factor (arbitrary) for simulating gas production.
  const productionFactor = 10;

  // Faraday's constant (Coulomb per mol)
  const faraday = 96485;

  // Generate bubbles if voltage/current exceed thresholds.
  useEffect(() => {
    if (voltage > 1 && current > 0.1) {
      const bubbleInterval = setInterval(() => {
        const newBubble: Bubble = {
          id: Date.now(),
          left: Math.random() * 80 + 10, // random horizontal position (10%-90%)
          side: Math.random() < 0.5 ? 'left' : 'right',
        };
        setBubbles(prev => [...prev, newBubble]);
      }, 1000);
      return () => clearInterval(bubbleInterval);
    }
  }, [voltage, current]);
  
  // Remove bubbles older than 3 seconds.
  useEffect(() => {
    const removeInterval = setInterval(() => {
      setBubbles(prev => prev.filter(bubble => Date.now() - bubble.id < 3000));
    }, 500);
    return () => clearInterval(removeInterval);
  }, []);
  
  // Data tracking: update gas production every second.
  useEffect(() => {
    const trackingInterval = setInterval(() => {
      if (voltage > 1 && current > 0.1) {
        // Hydrogen production: proportional to (current * productionFactor).
        // Oxygen production: half of hydrogen (due to 2:1 mole ratio).
        const hydrogenProduced = current * productionFactor;
        const oxygenProduced = (current * productionFactor) / 2;
        setHydrogenData(prev => [...prev, (prev.slice(-1)[0] || 0) + hydrogenProduced]);
        setOxygenData(prev => [...prev, (prev.slice(-1)[0] || 0) + oxygenProduced]);
        setTime(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(trackingInterval);
  }, [voltage, current]);
  
  // Prepare chart data for last 10 seconds.
  const chartLabels = Array.from({ length: time }, (_, i) => i.toString()).slice(-10);
  const chartHydrogenData = hydrogenData.slice(-10);
  const chartOxygenData = oxygenData.slice(-10);

  // Total cumulative production.
  const totalHydrogen = hydrogenData.length ? hydrogenData[hydrogenData.length - 1] : 0;
  const totalOxygen = oxygenData.length ? oxygenData[oxygenData.length - 1] : 0;

  // Reaction speeds at the electrodes (using Faraday’s law).
  // At the cathode (producing H₂): electrons required = 2, so mol/s = I / (2 * F).
  const hydrogenRate = current / (2 * faraday);
  // At the anode (producing O₂): electrons required = 4, so mol/s = I / (4 * F).
  const oxygenRate = current / (4 * faraday);

  return (
    <ScrollView style={styles.container}>
      {/* Header with local Guide state; back button now only returns to main menu */}
      <View style={styles.headerBar}>
        <Button title="Back" onPress={onBack} color="#007BFF" />
        <Text style={styles.headerTitle}>Experimentare</Text>
        <Button title="Ghid" onPress={() => setShowGuide(true)} color="#007BFF" />
      </View>

      {showGuide && <TheoreticalGuide onClose={() => setShowGuide(false)} />}
      
      <View style={styles.controls}>
        <Text style={styles.controlLabel}>Tensiune: {voltage.toFixed(1)} V</Text>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={12}
          step={0.1}
          value={voltage}
          onValueChange={setVoltage}
          minimumTrackTintColor="#007BFF"
          maximumTrackTintColor="#ccc"
        />
        <Text style={styles.controlLabel}>Intensitate: {current.toFixed(1)} A</Text>
        <Slider
          style={styles.slider}
          minimumValue={0.1}
          maximumValue={5}
          step={0.1}
          value={current}
          onValueChange={setCurrent}
          minimumTrackTintColor="#007BFF"
          maximumTrackTintColor="#ccc"
        />
      </View>

      {/* Lab Area: Two glasses with water, each with a nail, connected by a salt bridge */}
      <View style={styles.labArea}>
        <View style={styles.glassContainer}>
          {/* Left Glass */}
          <View style={styles.glass}>
            <Text style={styles.glassLabel}>Apă</Text>
            <View style={styles.water}>
              {bubbles
                .filter(bubble => bubble.side === 'left')
                .map(bubble => (
                  <FloatingBubble key={bubble.id} left={bubble.left} />
                ))}
              <View style={[styles.electrode, styles.leftElectrode]}>
                <Text style={styles.electrodeText}>Nail</Text>
              </View>
            </View>
          </View>
          {/* Salt Bridge */}
          <View style={styles.saltBridge}>
            <Text style={styles.saltText}>Sare</Text>
          </View>
          {/* Right Glass */}
          <View style={styles.glass}>
            <Text style={styles.glassLabel}>Apă</Text>
            <View style={styles.water}>
              {bubbles
                .filter(bubble => bubble.side === 'right')
                .map(bubble => (
                  <FloatingBubble key={bubble.id} left={bubble.left} />
                ))}
              <View style={[styles.electrode, styles.rightElectrode]}>
                <Text style={styles.electrodeText}>Nail</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.battery}>
          <Text style={styles.batteryText}>DC Battery</Text>
          <View style={styles.batterySettings}>
            <Text>{voltage.toFixed(1)} V</Text>
            <Text>{current.toFixed(1)} A</Text>
          </View>
        </View>
      </View>

      {/* Data Tracking Graph */}
      <Text style={styles.graphTitle}>Rate de Producție a Gazelor</Text>
      <LineChart
        data={{
          labels: chartLabels,
          datasets: [
            {
              data: chartHydrogenData,
              color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
              strokeWidth: 2,
            },
            {
              data: chartOxygenData,
              color: (opacity = 1) => `rgba(255, 193, 7, ${opacity})`,
              strokeWidth: 2,
            },
          ],
          legend: ['Hidrogen', 'Oxigen'],
        }}
        width={Dimensions.get('window').width - 20}
        height={220}
        chartConfig={{
          backgroundColor: '#E3F2FD',
          backgroundGradientFrom: '#E3F2FD',
          backgroundGradientTo: '#E3F2FD',
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
          style: { borderRadius: 16 },
          propsForDots: {
            r: '3',
            strokeWidth: '1',
            stroke: '#007BFF',
          },
        }}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16,
          alignSelf: 'center',
        }}
      />
      <Text style={styles.axisCaption}>
        X: Timp (s) | Y: Producție cumulativă
      </Text>

      {/* Additional Information */}
      <View style={styles.graphInfo}>
        <Text style={styles.infoText}>Timp de simulare: {time} s</Text>
        <Text style={styles.infoText}>
          Tensiune: {voltage.toFixed(1)} V | Intensitate: {current.toFixed(1)} A
        </Text>
        <Text style={styles.infoText}>
          Total Hidrogen produs: {totalHydrogen.toFixed(1)} unități
        </Text>
        <Text style={styles.infoText}>
          Total Oxigen produs: {totalOxygen.toFixed(1)} unități
        </Text>
      </View>

      {/* Reaction Speed Calculations */}
      <View style={styles.graphInfo}>
        <Text style={[styles.infoText, { fontWeight: 'bold' }]}>
          Viteza reacției electrolitice:
        </Text>
        <Text style={styles.infoText}>
          La catod (Hidrogen): {hydrogenRate.toExponential(2)} mol/s
        </Text>
        <Text style={styles.infoText}>
          La anod (Oxigen): {oxygenRate.toExponential(2)} mol/s
        </Text>
        <Text style={styles.infoText}>
          Formula: Pentru Hidrogen, rate = I / (2·F); pentru Oxigen, rate = I / (4·F)
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 10,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 20,
    color: '#007BFF',
  },
  controls: {
    marginBottom: 20,
  },
  controlLabel: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 15,
  },
  labArea: {
    borderWidth: 2,
    borderColor: '#007BFF',
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    padding: 10,
    marginBottom: 20,
  },
  glassContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  glass: {
    width: '40%',
    height: 250,
    borderWidth: 2,
    borderColor: '#007BFF',
    borderRadius: 15,
    backgroundColor: '#fff',
    overflow: 'hidden',
    alignItems: 'center',
  },
  glassLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007BFF',
    marginTop: 5,
  },
  water: {
    flex: 1,
    backgroundColor: '#d0eaff',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  electrode: {
    position: 'absolute',
    bottom: 10,
    width: 10,
    height: '40%',
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftElectrode: {
    left: 10,
  },
  rightElectrode: {
    right: 10,
  },
  electrodeText: {
    color: '#fff',
    fontSize: 10,
  },
  saltBridge: {
    width: '15%',
    height: 50,
    backgroundColor: '#ccc',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saltText: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  battery: {
    marginTop: 10,
    alignItems: 'center',
  },
  batteryText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  batterySettings: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '50%',
    marginTop: 5,
  },
  graphTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007BFF',
    textAlign: 'center',
    marginBottom: 5,
  },
  axisCaption: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
    marginBottom: 10,
  },
  graphInfo: {
    backgroundColor: '#F0F8FF',
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#333',
    marginVertical: 2,
  },
  bubble: {
    position: 'absolute',
    bottom: 0,
    width: 12,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 2,
    borderColor: '#007BFF',
    borderRadius: 6,
  },
});

export default ExperimentationScreen;
