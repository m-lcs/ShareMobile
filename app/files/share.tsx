import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Text, View, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { apiFetch } from '@/constants/api';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useRouter } from 'expo-router';

export default function ShareFileScreen() {
  const [file, setFile] = useState<DocumentPicker.DocumentResult | null>(null);
  const [description, setDescription] = useState('');
  const router = useRouter();

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync();
    if (result.type === 'success') {
      setFile(result);
    }
  };

  const getUserId = async () => {
    try {
      const response = await apiFetch('/auth/user');
      const data = await response.json();
      return data.id;
    } catch {
      Alert.alert('Erreur', 'Impossible de récupérer les informations utilisateur.');
      throw new Error('Utilisateur non connecté');
    }
  };

  const handleShareFile = async () => {
    if (!file || file.type !== 'success') {
      Alert.alert('Erreur', 'Veuillez sélectionner un fichier.');
      return;
    }

    try {
      const userId = await getUserId();
      const formData = new FormData();
      formData.append('user_id', `${userId}`);
      formData.append('nom_original', file.name);
      formData.append('nom_serveur', `server_${file.name}`);
      formData.append('date_envoi', new Date().toISOString());
      formData.append('extension', file.name.split('.').pop() || '');
      formData.append('taille', `${file.size || 0}`);
      formData.append('description', description);

      await apiFetch('/fichiers', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Succès', 'Fichier partagé avec succès.');
      setFile(null);
      setDescription('');
    } catch (error) {
      Alert.alert('Erreur', 'Échec du partage du fichier.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Partager un fichier</ThemedText>
      <TouchableOpacity style={styles.fileButton} onPress={handlePickFile}>
        <Text style={styles.fileButtonText}>
          {file ? `Fichier sélectionné : ${file.name}` : 'Sélectionner un fichier'}
        </Text>
      </TouchableOpacity>
      <TextInput
        style={styles.input}
        placeholder="Description"
        placeholderTextColor="#888"
        value={description}
        onChangeText={setDescription}
      />
      <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleShareFile}>
        <Text style={styles.buttonText}>Partager</Text>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  fileButton: {
    width: '80%',
    padding: 12,
    marginVertical: 10,
    borderRadius: 25,
    backgroundColor: '#1E90FF',
    alignItems: 'center',
  },
  fileButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  input: {
    width: '80%',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginVertical: 10,
    borderRadius: 25,
    backgroundColor: '#fff',
    color: '#000',
  },
  button: {
    width: '80%',
    paddingVertical: 14,
    borderRadius: 25,
    marginVertical: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  primaryButton: {
    backgroundColor: '#32CD32',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
