import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, Button, StyleSheet, Dimensions, ScrollView, Animated, SafeAreaView 
} from 'react-native';
import Slider from '@react-native-community/slider';
import { LineChart } from 'react-native-chart-kit';
import TheoreticalGuide from './TheoreticalGuide';

interface Bubble {
  id: number;
  left: number; // Horizontal position within a tube as percentage (0–100)
  side: 'left' | 'right'; // Indicates which tube the bubble appears in
}

interface ExperimentationScreenProps {
  onBack: () => void;
}

// FloatingBubble component: animates upward (to the water's surface) and fades out.
const FloatingBubble: React.FC<{ left: number; side: string }> = ({ left, side }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  
  // Each tube has proper width based on the container
  const tubeWidth = (Dimensions.get('window').width - 80) / 2;
  const pixelLeft = (left / 100) * tubeWidth;
  
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
          backgroundColor: side === 'left' ? 'rgba(173, 216, 230, 0.8)' : 'rgba(255, 255, 204, 0.8)',
        },
      ]}
    />
  );
};

// Moving Ion component for the salt bridge
const MovingIon: React.FC<{ initialPosition: number }> = ({ initialPosition }) => {
  const position = useRef(new Animated.Value(initialPosition)).current;
  
  useEffect(() => {
    // Start ion at random position for natural effect
    position.setValue(initialPosition);
  }, [initialPosition]);
  
  return (
    <Animated.View
      style={[
        styles.ion,
        {
          left: position,
          backgroundColor: '#FFCC00',
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
  const chartLabels = Array.from({ length: Math.max(10, time) }, (_, i) => (i + 1).toString()).slice(-10);
  const chartHydrogenData = hydrogenData.length ? [...Array(Math.max(0, 10 - hydrogenData.length)).fill(0), ...hydrogenData].slice(-10) : [0];
  const chartOxygenData = oxygenData.length ? [...Array(Math.max(0, 10 - oxygenData.length)).fill(0), ...oxygenData].slice(-10) : [0];

  // Total cumulative production.
  const totalHydrogen = hydrogenData.length ? hydrogenData[hydrogenData.length - 1] : 0;
  const totalOxygen = oxygenData.length ? oxygenData[oxygenData.length - 1] : 0;

  // Reaction speeds at the electrodes (using Faraday's law).
  // At the cathode (producing H₂): electrons required = 2, so mol/s = I / (2 * F).
  const hydrogenRate = current / (2 * faraday);
  // At the anode (producing O₂): electrons required = 4, so mol/s = I / (4 * F).
  const oxygenRate = current / (4 * faraday);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header with local Guide state; back button now only returns to main menu */}
        <View style={styles.headerBar}>
          <Button title="BACK" onPress={onBack} color="#007BFF" />
          <Text style={styles.headerTitle}>Experimentare</Text>
          <Button title="GHID" onPress={() => setShowGuide(true)} color="#007BFF" />
        </View>

        {showGuide && <TheoreticalGuide onClose={() => setShowGuide(false)} />}
        
        <View style={styles.controls}>
          <Text style={styles.controlLabel}>Voltage: {voltage.toFixed(1)} V</Text>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={12}
            step={0.1}
            value={voltage}
            onValueChange={setVoltage}
            minimumTrackTintColor="#007BFF"
            maximumTrackTintColor="#ccc"
            thumbTintColor="#009688"
          />
          <Text style={styles.controlLabel}>Current: {current.toFixed(1)} A</Text>
          <Slider
            style={styles.slider}
            minimumValue={0.1}
            maximumValue={5}
            step={0.1}
            value={current}
            onValueChange={setCurrent}
            minimumTrackTintColor="#007BFF"
            maximumTrackTintColor="#ccc"
            thumbTintColor="#009688"
          />
        </View>

        {/* Electrolysis Apparatus - Matching the provided image */}
        <View style={styles.apparatusContainer}>
          {/* Left Container */}
          <View style={styles.leftContainer}>
            <View style={styles.container1}>
              <Text style={styles.gasLabel}>H₂(g)</Text>
              <View style={[styles.solution, { backgroundColor: '#FFFFD6' }]}>
                {bubbles
                  .filter(bubble => bubble.side === 'left')
                  .map(bubble => (
                    <FloatingBubble key={bubble.id} left={bubble.left} side="left" />
                  ))}
              </View>
              <View style={styles.electrode}>
                <Text style={styles.electrodeLabel}>Fe</Text>
              </View>
            </View>
          </View>
          
          {/* Salt Bridge */}
          <View style={styles.saltBridgeContainer}>
            <Text style={styles.saltBridgeLabel}>Salt Bridge</Text>
            <View style={styles.saltBridge}>
              <MovingIon initialPosition={20} />
              <MovingIon initialPosition={80} />
              <MovingIon initialPosition={140} />
            </View>
            <View style={styles.leftArm} />
            <View style={styles.rightArm} />
          </View>
          
          {/* Voltmeter */}
          <View style={styles.voltmeterContainer}>
            <View style={styles.horizontalWire} />
            <View style={styles.voltmeter}>
              <Text style={styles.voltmeterText}>V</Text>
            </View>
          </View>
          
          {/* Right Container should be here in the actual implementation */}
          <View style={styles.rightContainer}>
            <View style={styles.container2}>
              <Text style={styles.gasLabel}>O₂(g)</Text>
              <View style={[styles.solution, { backgroundColor: '#D6EAFF' }]}>
                {bubbles
                  .filter(bubble => bubble.side === 'right')
                  .map(bubble => (
                    <FloatingBubble key={bubble.id} left={bubble.left} side="right" />
                  ))}
              </View>
              <View style={styles.electrode}>
                <Text style={styles.electrodeLabel}>Fe</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Circuit Diagram */}
        <View style={styles.circuitDiagram}>
          <View style={styles.battery}>
            <Text style={styles.batteryText}>DC Battery</Text>
            <Text style={styles.batteryValue}>{voltage.toFixed(1)} V {current.toFixed(1)} A</Text>
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
            fillShadowGradientOpacity: 0.6,
          }}
          bezier
          withInnerLines={true}
          withOuterLines={true}
          fromZero={true}
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
        
        {/* Chemical Reactions */}
        <View style={styles.reactions}>
          <View style={styles.reactionLeft}>
            <Text style={styles.reactionText}>2H₂O + 2e⁻ → H₂(g) + 2OH⁻</Text>
            <Text style={styles.reactionName}>Reducere</Text>
          </View>
          <View style={styles.reactionRight}>
            <Text style={styles.reactionText}>2H₂O → O₂(g) + 4H⁺ + 4e⁻</Text>
            <Text style={styles.reactionName}>Oxidare</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    padding: 10,
    paddingBottom: 40,
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
  apparatusContainer: {
    position: 'relative',
    height: 350,
    marginBottom: 20,
  },
  leftContainer: {
    position: 'absolute',
    left: 10,
    top: 50,
    width: '45%',
    height: 280,
  },
  rightContainer: {
    position: 'absolute',
    right: 10,
    top: 50,
    width: '45%',
    height: 280,
  },
  container1: {
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderColor: '#007BFF',
    borderRadius: 5,
    overflow: 'hidden',
  },
  container2: {
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderColor: '#007BFF',
    borderRadius: 5,
    overflow: 'hidden',
  },
  gasLabel: {
    position: 'absolute',
    top: 5,
    left: 10,
    fontWeight: 'bold',
    fontSize: 16,
    color: '#000',
    zIndex: 10,
  },
  solution: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  electrode: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    marginLeft: -40,
    width: 80,
    height: 40,
    backgroundColor: '#666666',
    justifyContent: 'center',
    alignItems: 'center',
  },
  electrodeLabel: {
    color: '#fff',
    fontWeight: 'bold',
  },
  saltBridgeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    alignItems: 'center',
  },
  saltBridgeLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  saltBridge: {
    width: '70%',
    height: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 10,
    position: 'relative',
  },
  leftArm: {
    position: 'absolute',
    top: 20,
    left: '16%',
    width: 1,
    height: 30,
    backgroundColor: 'black',
  },
  rightArm: {
    position: 'absolute',
    top: 20,
    right: '16%',
    width: 1,
    height: 30,
    backgroundColor: 'black',
  },
  voltmeterContainer: {
    position: 'absolute',
    top: 150,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  horizontalWire: {
    width: '80%',
    height: 1,
    backgroundColor: 'black',
  },
  voltmeter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'black',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -20,
  },
  voltmeterText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  ion: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    top: 5,
  },
  circuitDiagram: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  battery: {
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#007BFF',
    borderRadius: 10,
  },
  batteryText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  batteryValue: {
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
    width: 15,
    height: 15,
    borderRadius: 7.5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  reactions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  reactionLeft: {
    alignItems: 'center',
    width: '48%',
    padding: 10,
    backgroundColor: '#d6eaff',
    borderRadius: 10,
  },
  reactionRight: {
    alignItems: 'center',
    width: '48%',
    padding: 10,
    backgroundColor: '#ffffd6',
    borderRadius: 10,
  },
  reactionText: {
    fontSize: 12,
    textAlign: 'center',
  },
  reactionName: {
    fontWeight: 'bold',
    marginTop: 5,
    color: '#007BFF',
  },
});

export default ExperimentationScreen;