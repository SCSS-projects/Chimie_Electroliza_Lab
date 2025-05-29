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

// FloatingBubble component: animates upward and fades out.
const FloatingBubble: React.FC<{ left: number; side: string }> = ({ left, side }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  // Define parameters based on bubble type.
  const bubbleSize = side === 'right' ? 10 : 20;
  const animationDuration = side === 'right' ? 5000 : 3000;
  const bubbleColor = side === 'right' ? 'black' : (side === 'left' ? 'rgba(173, 216, 230, 0.8)' : 'rgba(255, 255, 204, 0.8)');

  // Each tube has proper width based on the container.
  const tubeWidth = (Dimensions.get('window').width - 80) / 2;
  const pixelLeft = (left / 100) * tubeWidth;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -150,
        duration: animationDuration,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: animationDuration,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateY, opacity, animationDuration]);

  return (
    <Animated.View
      style={[
        styles.bubble,
        {
          width: bubbleSize,
          height: bubbleSize,
          borderRadius: bubbleSize / 2,
          left: pixelLeft,
          transform: [{ translateY }],
          opacity,
          backgroundColor: bubbleColor,
        },
      ]}
    />
  );
};

// MovingIon component for the salt bridge.
const MovingIon: React.FC<{ initialPosition: number }> = ({ initialPosition }) => {
  const position = useRef(new Animated.Value(initialPosition)).current;
  
  useEffect(() => {
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

// Updated Screw component remains unchanged in implementation:
const Screw: React.FC<{ position: 'left' | 'right' }> = ({ position }) => (
  <View style={[
    styles.screw, 
    position === 'left' ? styles.leftScrew : styles.rightScrew
  ]}>
    <Text style={styles.screwText}>C</Text>
  </View>
);

// Adaugă componenta Battery
const Battery: React.FC = () => (
  <View style={styles.batteryContainer}>
    <View style={styles.battery}>
      <Text style={styles.batteryLabel}>Acumulator</Text>
    </View>
    {/* Fire de conexiune */}
    <View style={styles.wireRed} />
    <View style={styles.wireBlue} />
  </View>
);

const GasLabel: React.FC<{ position: 'left' | 'right'; text: string }> = ({ position, text }) => (
  <Text style={[
    styles.gasLabel, 
    position === 'left' ? styles.leftGasLabel : styles.rightGasLabel
  ]}>
    {text}
  </Text>
);

const ExperimentationScreen: React.FC<ExperimentationScreenProps> = ({ onBack }) => {
  const [voltage, setVoltage] = useState<number>(5);
  const [current, setCurrent] = useState<number>(0.5);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  
  // Data tracking for the graph.
  const [time, setTime] = useState<number>(0);
  const [hydrogenData, setHydrogenData] = useState<number[]>([]);
  const [oxygenData, setOxygenData] = useState<number[]>([]);

  const productionFactor = 10;
  const faraday = 96485;
  const gasConstant = 0.0821; // L·atm/(mol·K)
  const temperature = 298; // K (25°C)
  const pressure = 1; // atm

  // Calculate gas production rate in mL/s
  const calculateGasRate = (current: number, moles: number) => {
    const volume = (moles * gasConstant * temperature) / pressure;
    return volume * 1000; // Convert to mL
  };

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
  
  useEffect(() => {
    const removeInterval = setInterval(() => {
      setBubbles(prev => prev.filter(bubble => Date.now() - bubble.id < 3000));
    }, 500);
    return () => clearInterval(removeInterval);
  }, []);
  
  useEffect(() => {
    const trackingInterval = setInterval(() => {
      if (voltage > 1 && current > 0.1) {
        const hydrogenRate = calculateGasRate(current, current / (2 * faraday));
        const oxygenRate = calculateGasRate(current, current / (4 * faraday));
        setHydrogenData(prev => [...prev, (prev.slice(-1)[0] || 0) + hydrogenRate]);
        setOxygenData(prev => [...prev, (prev.slice(-1)[0] || 0) + oxygenRate]);
        setTime(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(trackingInterval);
  }, [voltage, current]);
  
  const chartLabels = Array.from({ length: Math.max(10, time) }, (_, i) => (i + 1).toString()).slice(-10);
  const chartHydrogenData = hydrogenData.length 
    ? [...Array(Math.max(0, 10 - hydrogenData.length)).fill(0), ...hydrogenData].slice(-10) 
    : [0];
  const chartOxygenData = oxygenData.length 
    ? [...Array(Math.max(0, 10 - oxygenData.length)).fill(0), ...oxygenData].slice(-10) 
    : [0];

  const totalHydrogen = hydrogenData.length ? hydrogenData[hydrogenData.length - 1] : 0;
  const totalOxygen = oxygenData.length ? oxygenData[oxygenData.length - 1] : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        {/* LEFT PANE: Controls, Graphs, and Data */}
        <View style={styles.leftPane}>
          <ScrollView style={styles.leftScroll} contentContainerStyle={styles.leftContent}>
            <View style={styles.headerBar}>
              <Button title="Inapoi" onPress={onBack} color="#007BFF" />
              <Text style={styles.headerTitle}>Experimentare</Text>
              <Button title="GHID" onPress={() => setShowGuide(true)} color="#007BFF" />
            </View>
            <View style={styles.controls}>
              <View style={styles.sliderContainer}>
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
                  thumbTintColor="#009688"
                />
              </View>
              <View style={styles.sliderContainer}>
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
                  thumbTintColor="#009688"
                />
              </View>
            </View>
            <View style={styles.circuitDiagram}>
              <View style={styles.battery}>
                <Text style={styles.batteryText}>Sursa</Text>
                <Text style={styles.batteryValue}>{voltage.toFixed(1)} V {current.toFixed(1)} A</Text>
              </View>
            </View>
            <Text style={styles.graphTitle}>Viteza de Producție a Gazelor</Text>
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
              width={Dimensions.get('window').width * 0.55}
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
            <View style={styles.graphInfo}>
              <Text style={styles.infoText}>Timp de simulare: {time} s</Text>
              <Text style={styles.infoText}>
                Tensiune: {voltage.toFixed(1)} V | Intensitate: {current.toFixed(1)} A
              </Text>
              <Text style={styles.infoText}>
                Viteza de producere H₂: {calculateGasRate(current, current / (2 * faraday)).toFixed(2)} mL/s
              </Text>
              <Text style={styles.infoText}>
                Viteza de producere O₂: {calculateGasRate(current, current / (4 * faraday)).toFixed(2)} mL/s
              </Text>
            </View>
          </ScrollView>
        </View>
        {/* RIGHT PANE: Apparatus (Glasses and connections) */}
        <View style={styles.rightPane}>
          <View style={styles.apparatusContainer}>
            <Battery />
            <View style={styles.leftContainer}>
              <View style={styles.container1}>
                <GasLabel position="left" text="H₂(g)" />
                <View style={[styles.solution, { backgroundColor: '#D6EAFF' }]}>
                  {bubbles
                    .filter(bubble => bubble.side === 'left')
                    .map(bubble => (
                      <FloatingBubble key={bubble.id} left={bubble.left} side="left" />
                    ))}
                </View>
                <Screw position="left" />
              </View>
            </View>
            <View style={styles.saltBridgeContainer}>
              <Text style={styles.saltBridgeLabel}>Punte de Sare</Text>
              <View style={styles.saltBridge}>
                <MovingIon initialPosition={20} />
                <MovingIon initialPosition={80} />
                <MovingIon initialPosition={140} />
              </View>
            </View>
            <View style={styles.rightContainer}>
              <View style={styles.container2}>
                <GasLabel position="right" text="O₂(g)" />
                <View style={[styles.solution, { backgroundColor: '#FFE4E1' }]}>
                  {bubbles
                    .filter(bubble => bubble.side === 'right')
                    .map(bubble => (
                      <FloatingBubble key={bubble.id} left={bubble.left} side="right" />
                    ))}
                </View>
                <Screw position="right" />
              </View>
            </View>
          </View>
          {/* Reactions moved below the glasses */}
          <View style={styles.reactionsContainer}>
            <View style={[styles.reactionBox, { backgroundColor: '#FFFFD6' }]}>
              <Text style={styles.reactionText}>2H₂O + 2e⁻ → H₂(g) + 2OH⁻</Text>
              <Text style={styles.reactionName}>Reducere</Text>
            </View>
            <View style={[styles.reactionBox, { backgroundColor: '#D6EAFF' }]}>
              <Text style={styles.reactionText}>2H₂O → O₂(g) + 4H⁺ + 4e⁻</Text>
              <Text style={styles.reactionName}>Oxidare</Text>
            </View>
          </View>
        </View>
      </View>
      {showGuide && <TheoreticalGuide onClose={() => setShowGuide(false)} />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
    width: 1640, // for 1640x1024 resolution
    height: 1024,
    alignSelf: 'center',
  },
  leftPane: {
    flex: 3,
    padding: 10,
  },
  leftScroll: {
    flex: 1,
  },
  leftContent: {
    paddingBottom: 40,
  },
  rightPane: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 20,
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
  sliderContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  slider: {
    width: Dimensions.get('window').width * 0.55, // match the graph width
    height: 20,
    marginBottom: 15,
  },
  circuitDiagram: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  battery: {
    width: 180, // Increased width
    height: 50,
    backgroundColor: '#999',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#666',
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
  apparatusContainer: {
    width: '90%',
    height: 400,
    marginBottom: 20,
    position: 'relative',
  },
  leftContainer: {
    position: 'absolute',
    left: 10,
    top: 80, // moved down from 50 to 80
    width: '45%',
    height: 280,
  },
  rightContainer: {
    position: 'absolute',
    right: 10,
    top: 80, // moved down from 50 to 80
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
    fontWeight: 'bold',
    fontSize: 16,
    color: '#000',
    zIndex: 10,
  },
  leftGasLabel: {
    left: 10,
  },
  rightGasLabel: {
    right: 10,
  },
  solution: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  // Removed electrode in favor of the Screw component.
  screw: {
    width: 30,
    height: 100,    // mărim înălțimea la 100px pentru a fi mai lungi
    backgroundColor: '#888888',
    borderWidth: 1,
    borderColor: '#555555',
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
    top: 30,       // Adjusted top position to be higher, near wire ends
    zIndex: 10,
  },
  // Adăugăm stiluri specifice pentru fiecare șurub
  leftScrew: {
    right: '15%',  // Moved further from salt bridge
  },
  rightScrew: {
    left: '15%',   // Moved further from salt bridge
  },
  screwText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  saltBridgeContainer: {
    position: 'absolute',
    top: 200, // Adjusted top to be below the electrodes
    left: 0,
    right: 0,
    height: 50,
    alignItems: 'center',
    zIndex: 15,
  },
  saltBridgeLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  saltBridge: {
    width: '40%',  // Reduced width
    height: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 10,
    position: 'relative',
    marginLeft: '-5%',
  },
  // Voltmeter has been removed.
  horizontalWire: {
    width: '80%',
    height: 1,
    backgroundColor: 'black',
  },
  ion: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFCC00',
    top: 6,
    zIndex: 16,
  },
  reactionsContainer: {
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  reactionBox: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  reactionText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 3,
  },
  reactionName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#007BFF',
  },
  bubble: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  batteryContainer: {
    position: 'absolute',
    top: 10,
    left: '25%',
    right: '25%',
    alignItems: 'center',
    zIndex: 5,
  },

  batteryLabel: {
    color: '#000', // Changed text color to black
    fontSize: 12,
    fontWeight: 'bold',
  },

  wireRed: {
    position: 'absolute',
    width: 2,
    height: 120, // Increased height to reach electrodes
    backgroundColor: 'red',
    left: '30%',
    top: '100%', // Still relative to battery container
  },

  wireBlue: {
    position: 'absolute',
    width: 2,
    height: 120, // Increased height to reach electrodes
    backgroundColor: 'blue',
    right: '30%',
    top: '100%', // Still relative to battery container
  },
});

export default ExperimentationScreen;