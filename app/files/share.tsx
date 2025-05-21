import { useState } from 'react';
import { StyleSheet, TouchableOpacity, Text, View, Alert, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { apiFetch } from '@/constants/api';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';

const ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpeg', 'jpg'];
const MAX_SIZE = 200 * 1024;

export default function ShareFileScreen() {
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handlePickFile = async () => {
    console.log('Ouverture du picker...');
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/jpg',
      ],
      copyToCacheDirectory: true,
      multiple: false,
    });
    console.log('Résultat picker:', result);

    if ((result as any).assets && Array.isArray((result as any).assets) && (result as any).assets.length > 0) {
      setFile((result as any).assets[0]);
      console.log('Fichier sélectionné (assets[0]):', (result as any).assets[0]);
    } else if ((result as any).canceled === false && (result as any).assets && (result as any).assets.length === 0) {
      setFile(null);
      console.log('Aucun fichier sélectionné');
    } else if (result.type === 'success' && result.uri && result.name) {
      setFile(result);
      console.log('Fichier sélectionné (direct):', result);
    } else {
      setFile(null);
      console.log('Sélection annulée');
    }
  };

  const isWeb = Platform.OS === 'web';

  const handleShareFile = async () => {
    console.log('Tentative de partage du fichier:', file);
    if (!file || !file.name || !file.uri) {
      Alert.alert('Erreur', 'Veuillez sélectionner un fichier.');
      console.log('Erreur: fichier non sélectionné ou incomplet');
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const size = file.size ?? 0;
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      Alert.alert('Erreur', 'Seuls les fichiers PDF, PNG, JPEG, JPG sont autorisés.');
      console.log('Erreur: extension non autorisée', ext);
      return;
    }
    if (size > MAX_SIZE) {
      Alert.alert('Erreur', 'Le fichier ne doit pas dépasser 200 Ko.');
      console.log('Erreur: fichier trop volumineux', size);
      return;
    }

    setLoading(true);
    try {
      // Utilise le FormData natif du navigateur sur le web
      const formData = isWeb ? new window.FormData() : new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type:
          ext === 'pdf'
            ? 'application/pdf'
            : ext === 'png'
            ? 'image/png'
            : 'image/jpeg',
      } as any);
      formData.append('nom_original', file.name);
      formData.append('nom_serveur', `server_${file.name}`);
      formData.append('date_envoi', new Date().toISOString());
      formData.append('extension', ext);
      formData.append('taille', `${size}`);

      console.log('FormData prêt à l\'envoi:', formData);

      await apiFetch('/fichiers', {
        method: 'POST',
        body: formData,
        // Ne PAS mettre de headers ici !
      });

      Alert.alert('Succès', 'Fichier partagé avec succès.');
      setFile(null);
      console.log('Fichier partagé avec succès');
    } catch (error) {
      Alert.alert('Erreur', 'Échec du partage du fichier.');
      console.log('Erreur lors de l\'envoi:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        <Text style={{ color: '#1E90FF' }}>Partager</Text>
        <Text style={{ color: '#32CD32' }}> un fichier</Text>
      </ThemedText>
      <ThemedText type="subtitle" style={styles.subtitle}>
        Sélectionnez un fichier PDF, PNG, JPEG ou JPG (max 200 Ko)
      </ThemedText>
      <TouchableOpacity
        style={styles.fileButton}
        onPress={handlePickFile}
        activeOpacity={0.85}
      >
        <Ionicons name="cloud-upload-outline" size={28} color="#fff" style={{ marginRight: 10 }} />
        <Text style={styles.fileButtonText}>
          {file && file.name ? `Fichier : ${file.name}` : 'Choisir un fichier'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.button,
          styles.primaryButton,
          (!file || loading) && styles.buttonDisabled,
        ]}
        onPress={handleShareFile}
        activeOpacity={0.85}
        disabled={!file || loading}
      >
        <Ionicons name="send" size={22} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.buttonText}>
          {loading ? 'Envoi...' : 'Partager'}
        </Text>
      </TouchableOpacity>
      {/* Affichage debug */}
      <View style={{ marginTop: 16 }}>
        <Text style={{ color: '#fff', fontSize: 12 }}>
          {file ? JSON.stringify(file, null, 2) : 'Aucun fichier sélectionné'}
        </Text>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 36 : 56,
    backgroundColor: '#101014',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 17,
    color: '#aaa',
    marginBottom: 28,
    textAlign: 'center',
    fontWeight: '500',
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '85%',
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginVertical: 18,
    borderRadius: 22,
    backgroundColor: '#1E90FF',
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  fileButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '85%',
    paddingVertical: 16,
    borderRadius: 22,
    marginVertical: 18,
    justifyContent: 'center',
    shadowColor: '#32CD32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 5,
  },
  primaryButton: {
    backgroundColor: '#32CD32',
  },
  buttonDisabled: {
    backgroundColor: '#6c757d',
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
