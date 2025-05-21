import { useEffect, useState } from 'react';
import { StyleSheet, FlatList, View, Text, Platform, Image, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { apiFetch } from '@/constants/api';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

type File = {
  id: number;
  nomOriginal: string;
  nomServeur: string;
  dateEnvoi: string;
  extension: string;
  taille: number;
  user?: string;
};

type User = {
  id: number;
  nom?: string;
  prenom?: string;
};

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const SERVER_URL = 'http://192.168.1.100:8000';

function FileImage({ imageUrl }: { imageUrl: string }) {
  const [imageError, setImageError] = useState(false);

  return imageError ? (
    <View style={[styles.fileImage, styles.imageError]}>
      <Text style={{ color: '#fff', textAlign: 'center', marginTop: 50 }}>Image non dispo</Text>
      <Text style={{ color: '#fff', fontSize: 10, marginTop: 8, textAlign: 'center' }}>{imageUrl}</Text>
      <TouchableOpacity
        style={{
          marginTop: 10,
          backgroundColor: '#1E90FF',
          borderRadius: 8,
          paddingVertical: 6,
          paddingHorizontal: 12,
        }}
        onPress={() => Linking.openURL(imageUrl)}
      >
        <Text style={{ color: '#fff', fontSize: 13 }}>Tester l'image</Text>
      </TouchableOpacity>
    </View>
  ) : (
    <Image
      source={{ uri: imageUrl }}
      style={styles.fileImage}
      resizeMode="cover"
      onError={() => setImageError(true)}
    />
  );
}

export default function HomeScreen() {
  const [files, setFiles] = useState<File[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchFilesAndUsers = async () => {
      try {
        setError(null);
        const [fileData, userData] = await Promise.all([
          apiFetch('/fichiers'),
          apiFetch('/users'),
        ]);
        setFiles(fileData['hydra:member'] || []);
        setUsers(userData['hydra:member'] || []);
      } catch (e: any) {
        setFiles([]);
        setUsers([]);
        setError(e?.message || 'Erreur inconnue');
      }
    };
    fetchFilesAndUsers();
  }, []);

  const getUserDisplay = (userApiUri?: string) => {
    if (!userApiUri) return '-';
    const id = parseInt(userApiUri.split('/').pop() || '', 10);
    const user = users.find((u) => u.id === id);
    if (user) {
      const nomComplet = [user.prenom, user.nom].filter(Boolean).join(' ');
      return `${nomComplet || 'Utilisateur'} (${user.id})`;
    }
    return `Utilisateur (${id})`;
  };

  const handleDownload = async (item: File) => {
    try {
      const fileUrl = `${SERVER_URL}/uploads/${item.nomServeur}`;
      const fileExt = item.extension?.toLowerCase() || 'file';
      const fileName = item.nomOriginal || `fichier.${fileExt}`;
      const fileUri = FileSystem.cacheDirectory + fileName;

      const downloadResumable = FileSystem.createDownloadResumable(
        fileUrl,
        fileUri
      );
      const { uri } = await downloadResumable.downloadAsync();

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Téléchargement', `Fichier téléchargé à : ${uri}`);
      }
    } catch (e) {
      Alert.alert('Erreur', "Impossible de télécharger ce fichier.");
    }
  };

  const renderItem = ({ item }: { item: File }) => {
    const isImage = IMAGE_EXTENSIONS.includes(item.extension?.toLowerCase());
    const imageUrl = isImage
      ? `${SERVER_URL}/uploads/${item.nomServeur}`
      : null;

    return (
      <View style={styles.fileItem}>
        {isImage && imageUrl && <FileImage imageUrl={imageUrl} />}
        <ThemedText type="defaultSemiBold" style={styles.fileName}>{item.nomOriginal}</ThemedText>
        <View style={styles.fileMetaRow}>
          <ThemedText style={styles.fileMeta}>👤 {getUserDisplay(item.user)}</ThemedText>
          <ThemedText style={styles.fileMeta}>📅 {new Date(item.dateEnvoi).toLocaleDateString()}</ThemedText>
        </View>
        <View style={styles.fileMetaRow}>
          <ThemedText style={styles.fileMeta}>📄 {item.extension?.toUpperCase()}</ThemedText>
          <ThemedText style={styles.fileMeta}>💾 {(item.taille / 1024).toFixed(2)} Ko</ThemedText>
        </View>
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={() => handleDownload(item)}
        >
          <Text style={styles.downloadButtonText}>Télécharger</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        <Text style={{ color: '#1E90FF' }}>Share</Text>
        <Text style={{ color: '#32CD32' }}>Mobile</Text>
      </ThemedText>
      <ThemedText type="subtitle" style={styles.subtitle}>
        Partagez et consultez vos fichiers simplement
      </ThemedText>
      {error ? (
        <ThemedText style={[styles.emptyText, { color: 'red' }]}>
          Erreur : {error}
        </ThemedText>
      ) : files.length === 0 ? (
        <ThemedText style={styles.emptyText}>
          Aucun fichier trouvé.
        </ThemedText>
      ) : (
        <FlatList
          data={files}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/files/share')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>＋</Text>
        <Text style={styles.fabText}>Partager un fichier</Text>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 36 : 56,
    paddingHorizontal: 0,
    backgroundColor: '#101014',
    alignItems: 'center',
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    color: '#aaa',
    marginBottom: 18,
    textAlign: 'center',
    fontWeight: '500',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 120,
    width: '100%',
  },
  fileItem: {
    backgroundColor: '#181C24',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  fileImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#222',
    overflow: 'hidden',
  },
  imageError: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#444',
  },
  fileName: {
    fontSize: 18,
    marginBottom: 8,
    color: '#fff',
  },
  fileMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  fileMeta: {
    color: '#b0b0b0',
    fontSize: 14,
  },
  emptyText: {
    color: '#fff',
    marginTop: 32,
    fontSize: 18,
    textAlign: 'center',
    opacity: 0.7,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E90FF',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 32,
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginRight: 8,
    marginTop: -2,
  },
  fabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  downloadButton: {
    marginTop: 10,
    backgroundColor: '#32CD32',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  downloadButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
