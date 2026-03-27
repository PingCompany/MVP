import { useState, useRef } from "react";
import {
  View,
  TextInput,
  Pressable,
  Text,
  StyleSheet,
  Platform,
  ActionSheetIOS,
  Alert,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import type { Attachment } from "@/lib/fileUpload";
import { formatFileSize, isImageType } from "@/lib/fileUpload";

interface PendingFile {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
}

interface MessageComposerProps {
  onSend: (body: string, pendingFiles?: PendingFile[]) => void;
  enableAttachments?: boolean;
  placeholder?: string;
}

export function MessageComposer({
  onSend,
  enableAttachments = false,
  placeholder = "Message...",
}: MessageComposerProps) {
  const [text, setText] = useState("");
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed && pendingFiles.length === 0) return;

    onSend(trimmed, pendingFiles.length > 0 ? pendingFiles : undefined);
    setText("");
    setPendingFiles([]);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPendingFiles((prev) => [
        ...prev,
        {
          uri: asset.uri,
          name: asset.fileName ?? "image.jpg",
          mimeType: asset.mimeType ?? "image/jpeg",
          size: asset.fileSize ?? 0,
        },
      ]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Camera access is required to take photos.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPendingFiles((prev) => [
        ...prev,
        {
          uri: asset.uri,
          name: asset.fileName ?? "photo.jpg",
          mimeType: asset.mimeType ?? "image/jpeg",
          size: asset.fileSize ?? 0,
        },
      ]);
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPendingFiles((prev) => [
        ...prev,
        {
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType ?? "application/octet-stream",
          size: asset.size ?? 0,
        },
      ]);
    }
  };

  const showAttachmentOptions = () => {
    const options = ["Photo from Gallery", "Take Photo", "Choose File", "Cancel"];
    const cancelIndex = 3;

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: cancelIndex },
        (index) => {
          if (index === 0) pickImage();
          else if (index === 1) takePhoto();
          else if (index === 2) pickDocument();
        },
      );
    } else {
      // Android fallback — just pick from gallery for now
      pickImage();
    }
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.wrapper}>
      {pendingFiles.length > 0 && (
        <View style={styles.pendingFiles}>
          {pendingFiles.map((file, index) => (
            <View key={index} style={styles.pendingFile}>
              {isImageType(file.mimeType) ? (
                <Image source={{ uri: file.uri }} style={styles.pendingThumb} />
              ) : (
                <View style={styles.pendingFileIcon}>
                  <Text style={styles.pendingFileIconText}>📄</Text>
                </View>
              )}
              <Text style={styles.pendingFileName} numberOfLines={1}>
                {file.name}
              </Text>
              <Pressable onPress={() => removePendingFile(index)}>
                <Text style={styles.removeFile}>✕</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <View style={styles.container}>
        {enableAttachments && (
          <Pressable onPress={showAttachmentOptions} style={styles.attachBtn}>
            <Text style={styles.attachIcon}>+</Text>
          </Pressable>
        )}

        <TextInput
          ref={inputRef}
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor="#666"
          multiline
          maxLength={4000}
          returnKeyType="default"
        />

        <Pressable
          onPress={handleSend}
          style={[
            styles.sendBtn,
            (!text.trim() && pendingFiles.length === 0) && styles.sendBtnDisabled,
          ]}
          disabled={!text.trim() && pendingFiles.length === 0}
        >
          <Text style={styles.sendIcon}>↑</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#333",
    backgroundColor: "#111",
  },
  pendingFiles: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
  },
  pendingFile: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
  },
  pendingThumb: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  pendingFileIcon: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  pendingFileIconText: {
    fontSize: 14,
  },
  pendingFileName: {
    fontSize: 12,
    color: "#ccc",
    maxWidth: 100,
  },
  removeFile: {
    color: "#888",
    fontSize: 14,
    paddingLeft: 4,
  },
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 6,
  },
  attachBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  attachIcon: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  input: {
    flex: 1,
    backgroundColor: "#222",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 16,
    maxHeight: 120,
    minHeight: 40,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#0a7ea4",
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendIcon: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
