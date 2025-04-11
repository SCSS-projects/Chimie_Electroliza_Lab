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
        
        <Text style={styles.sectionHeader}>Electroliza Apei</Text>
        <Text style={styles.text}>
          Electroliza apei implică descompunerea acesteia în hidrogen și oxigen prin aplicarea unui curent electric.
          Reacția principală este: {"\n"}2H₂O(l) → 2H₂(g) + O₂(g)
        </Text>
        
        <Text style={styles.sectionHeader}>Puntea de Sare</Text>
        <Text style={styles.text}>
          Puntea de sare permite migrarea ionilor (Na⁺ și Cl⁻) între cele două pahare, menținând echilibrul electric.
        </Text>
        
        <Text style={styles.sectionHeader}>Calculul Vitezei Reacției Electrolitice</Text>
        <Text style={styles.text}>
          Pentru producția de hidrogen la catod:{"\n"}
          Viteza = I / (2 · F) (mol/s){"\n"}
          Pentru producția de oxigen la anod:{"\n"}
          Viteza = I / (4 · F) (mol/s){"\n"}
          unde I este intensitatea curentului în amperi și F este constanta lui Faraday (~96485 C/mol).
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
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
