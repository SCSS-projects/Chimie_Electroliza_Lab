import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, StyleSheet, Dimensions, ScrollView, Animated } from 'react-native';
import Slider from '@react-native-community/slider';
import { LineChart } from 'react-native-chart-kit';

interface Bubble {
  id: number;
  left: number; // position inside the glass (percentage 0–100)
  side: 'left' | 'right'; // which glass the bubble belongs to
}

interface ExperimentationScreenProps {
  onBack: () => void;
  onShowGuide: () => void;
}

// FloatingBubble component: Each bubble animates upward (rising to the water surface) and fades out.
const FloatingBubble: React.FC<{ left: number }> = ({ left }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  // Convert percentage to pixel value. (Assumes each glass's width is roughly half the container.)
  const containerWidth = (Dimensions.get('window').width - 20) / 2;
  const pixelLeft = (left / 100) * containerWidth;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -150, // bubble rises upward by 150 pixels (adjustable)
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

const ExperimentationScreen: React.FC<ExperimentationScreenProps> = ({ onBack, onShowGuide }) => {
  const [voltage, setVoltage] = useState<number>(5);
  const [current, setCurrent] = useState<number>(0.5);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  // Data tracking states for the graph.
  const [time, setTime] = useState<number>(0);
  const [hydrogenData, setHydrogenData] = useState<number[]>([]);
  const [oxygenData, setOxygenData] = useState<number[]>([]);

  // Arbitrary production factor to simulate gas production.
  const productionFactor = 10;

  // Generate bubbles if voltage/current are above thresholds.
  useEffect(() => {
    if (voltage > 1 && current > 0.1) {
      const bubbleInterval = setInterval(() => {
        const newBubble: Bubble = {
          id: Date.now(),
          left: Math.random() * 80 + 10, // random horizontal position within the glass (10%-90%)
          side: Math.random() < 0.5 ? 'left' : 'right',
        };
        setBubbles(prev => [...prev, newBubble]);
      }, 1000);
      return () => clearInterval(bubbleInterval);
    }
  }, [voltage, current]);

  // Remove bubbles after they've been visible for 3 seconds.
  useEffect(() => {
    const removeInterval = setInterval(() => {
      setBubbles(prev => prev.filter(bubble => Date.now() - bubble.id < 3000));
    }, 500);
    return () => clearInterval(removeInterval);
  }, []);

  // Data tracking: update gas production data every second when conditions are met.
  useEffect(() => {
    const trackingInterval = setInterval(() => {
      if (voltage > 1 && current > 0.1) {
        // Hydrogen production is proportional to current * productionFactor.
        // Oxygen production is half of that (due to the 2:1 mole ratio in water electrolysis).
        const hydrogenProduced = current * productionFactor;
        const oxygenProduced = (current * productionFactor) / 2;
        setHydrogenData(prev => [...prev, (prev.slice(-1)[0] || 0) + hydrogenProduced]);
        setOxygenData(prev => [...prev, (prev.slice(-1)[0] || 0) + oxygenProduced]);
        setTime(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(trackingInterval);
  }, [voltage, current]);

  // Prepare chart data for the last 10 seconds.
  const chartLabels = Array.from({ length: time }, (_, i) => i.toString()).slice(-10);
  const chartHydrogenData = hydrogenData.slice(-10);
  const chartOxygenData = oxygenData.slice(-10);

  // Total cumulative values.
  const totalHydrogen = hydrogenData.length ? hydrogenData[hydrogenData.length - 1] : 0;
  const totalOxygen = oxygenData.length ? oxygenData[oxygenData.length - 1] : 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerBar}>
        <Button title="Back" onPress={onBack} color="#007BFF" />
        <Text style={styles.headerTitle}>Experimentation</Text>
        <Button title="Guide" onPress={onShowGuide} color="#007BFF" />
      </View>

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
        />
      </View>

      {/* New Lab Area with two glasses and a salt bridge */}
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
      <Text style={styles.graphTitle}>Gas Production Rates</Text>
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
          legend: ['Hydrogen', 'Oxygen'],
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
          style: {
            borderRadius: 16,
          },
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
        X-axis: Time (s) | Y-axis: Cumulative Gas Production
      </Text>

      {/* Additional Graph Information */}
      <View style={styles.graphInfo}>
        <Text style={styles.infoText}>Simulation Time: {time} s</Text>
        <Text style={styles.infoText}>
          Voltage: {voltage.toFixed(1)} V | Current: {current.toFixed(1)} A
        </Text>
        <Text style={styles.infoText}>
          Total Hydrogen Produced: {totalHydrogen.toFixed(1)} units
        </Text>
        <Text style={styles.infoText}>
          Total Oxygen Produced: {totalOxygen.toFixed(1)} units
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
  // New glass container (for two glasses and a salt bridge)
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
  // Salt bridge connecting the two glasses.
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
