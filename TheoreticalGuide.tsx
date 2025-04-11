import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

interface TheoreticalGuideProps {
  onClose: () => void;
}

const TheoreticalGuide: React.FC<TheoreticalGuideProps> = ({ onClose }) => {
  return (
    <View style={styles.modal}>
      <View style={styles.content}>
        <Button title="Închide" onPress={onClose} color="#007BFF" />
        <Text style={styles.header}>Ghid Teoretic</Text>
        <Text style={styles.sectionHeader}>Teoria Electrolizei</Text>
        <Text style={styles.text}>
          Electroliza apei implică descompunerea apei în hidrogen și oxigen prin aplicarea unui curent electric. 
          Formula principală este: 2H₂O(l) → 2H₂(g) + O₂(g).
        </Text>
        <Text style={styles.sectionHeader}>Puntea de Sare</Text>
        <Text style={styles.text}>
          Puntea de sare permite migrarea ionilor (Na⁺ și Cl⁻) între cele două pahare, menținând echilibrul electric.
        </Text>
        <Text style={styles.sectionHeader}>Formule Suplimentare</Text>
        <Text style={styles.text}>
          • 2NaCl → 2Na⁺ + 2Cl⁻{"\n"}
          • 2H₂O(l) → 2H₂(g) + O₂(g)
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '90%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
  },
  header: {
    fontSize: 22,
    color: '#007BFF',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 18,
    color: '#007BFF',
    fontWeight: 'bold',
    marginTop: 10,
  },
  text: {
    fontSize: 14,
    color: '#333',
    marginTop: 5,
    lineHeight: 20,
  },
});

export default TheoreticalGuide;
