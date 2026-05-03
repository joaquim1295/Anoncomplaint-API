import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { apiRequest, API_BASE_URL } from "./src/api/client";
import { clearToken, getToken, setToken } from "./src/storage/auth";
import type { Complaint, NotificationItem, User } from "./src/types";

type Tab = "feed" | "create" | "notifications" | "auth";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("feed");
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [form, setForm] = useState({ content: "", tags: "" });
  const [authForm, setAuthForm] = useState({
    mode: "login" as "login" | "register",
    emailOrUsername: "",
    email: "",
    username: "",
    password: "",
  });

  const title = useMemo(() => {
    if (!user) return "Auth";
    if (tab === "create") return "Nova Denúncia";
    if (tab === "notifications") return "Notificações";
    if (tab === "auth") return "Conta";
    return "Feed";
  }, [tab, user]);

  async function bootstrap() {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        await loadPublicFeed();
        setUser(null);
      } else {
        await Promise.all([loadCurrentUser(), loadFeed()]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao iniciar app.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    bootstrap();
  }, []);

  async function loadPublicFeed() {
    const data = await apiRequest<Complaint[]>("/complaints?page=1&limit=20");
    setComplaints(data);
  }

  async function loadFeed() {
    const data = await apiRequest<Complaint[]>("/complaints?page=1&limit=20", { auth: true });
    setComplaints(data);
  }

  async function loadCurrentUser() {
    const me = await apiRequest<User>("/auth/me", { auth: true });
    setUser(me);
  }

  async function loadNotifications() {
    const data = await apiRequest<NotificationItem[]>("/notifications?page=1&limit=30", { auth: true });
    setNotifications(data);
  }

  async function submitAuth() {
    setError(null);
    try {
      if (authForm.mode === "login") {
        const result = await apiRequest<{ token: string; user: User }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({
            emailOrUsername: authForm.emailOrUsername,
            password: authForm.password,
          }),
        });
        await setToken(result.token);
      } else {
        const result = await apiRequest<{ id: string; email: string; username?: string; role?: string; token?: string }>(
          "/auth/register",
          {
            method: "POST",
            body: JSON.stringify({
              email: authForm.email,
              username: authForm.username || undefined,
              password: authForm.password,
            }),
          }
        );
        if (result.token) {
          await setToken(result.token);
        }
      }
      await Promise.all([loadCurrentUser(), loadFeed()]);
      setTab("feed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no login/registro.");
    }
  }

  async function submitComplaint() {
    if (!form.content.trim()) {
      setError("Digite o conteúdo da denúncia.");
      return;
    }
    setError(null);
    try {
      await apiRequest("/complaints", {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          content: form.content.trim(),
          tags: form.tags
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      setForm({ content: "", tags: "" });
      setTab("feed");
      await loadFeed();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao criar denúncia.");
    }
  }

  async function logout() {
    await clearToken();
    setUser(null);
    setTab("feed");
    await loadPublicFeed();
  }

  useEffect(() => {
    if (!user) return;
    if (tab === "notifications") {
      loadNotifications().catch((e) => setError(e instanceof Error ? e.message : "Falha ao carregar notificações."));
    }
  }, [tab, user]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <StatusBar style="light" />
        <ActivityIndicator color="#10b981" />
        <Text style={styles.muted}>Carregando app mobile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.brand}>
          <Text style={styles.brandSmart}>Smart</Text>
          <Text style={styles.brandRest}>Complaint Mobile</Text>
        </Text>
        <Text style={styles.subtitle}>{title}</Text>
        <Text style={styles.apiUrl}>API: {API_BASE_URL}</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!user ? (
        <ScrollView style={styles.panel} contentContainerStyle={{ gap: 10 }}>
          <View style={styles.segment}>
            <TouchableOpacity
              style={[styles.segmentBtn, authForm.mode === "login" && styles.segmentBtnActive]}
              onPress={() => setAuthForm((prev) => ({ ...prev, mode: "login" }))}
            >
              <Text style={styles.segmentText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentBtn, authForm.mode === "register" && styles.segmentBtnActive]}
              onPress={() => setAuthForm((prev) => ({ ...prev, mode: "register" }))}
            >
              <Text style={styles.segmentText}>Registro</Text>
            </TouchableOpacity>
          </View>

          {authForm.mode === "login" ? (
            <TextInput
              style={styles.input}
              placeholder="Email ou username"
              placeholderTextColor="#a1a1aa"
              value={authForm.emailOrUsername}
              onChangeText={(v) => setAuthForm((p) => ({ ...p, emailOrUsername: v }))}
            />
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#a1a1aa"
                value={authForm.email}
                onChangeText={(v) => setAuthForm((p) => ({ ...p, email: v }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Username (opcional)"
                placeholderTextColor="#a1a1aa"
                value={authForm.username}
                onChangeText={(v) => setAuthForm((p) => ({ ...p, username: v }))}
              />
            </>
          )}
          <TextInput
            secureTextEntry
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#a1a1aa"
            value={authForm.password}
            onChangeText={(v) => setAuthForm((p) => ({ ...p, password: v }))}
          />
          <TouchableOpacity style={styles.primaryBtn} onPress={submitAuth}>
            <Text style={styles.primaryBtnText}>Entrar</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <>
          <View style={styles.tabs}>
            <TabButton active={tab === "feed"} label="Feed" onPress={() => setTab("feed")} />
            <TabButton active={tab === "create"} label="Criar" onPress={() => setTab("create")} />
            <TabButton active={tab === "notifications"} label="Alertas" onPress={() => setTab("notifications")} />
            <TabButton active={tab === "auth"} label="Conta" onPress={() => setTab("auth")} />
          </View>

          {tab === "feed" && (
            <FlatList
              style={styles.panel}
              data={complaints}
              keyExtractor={(item) => item.id}
              refreshing={false}
              onRefresh={() => loadFeed().catch((e) => setError(e instanceof Error ? e.message : "Erro ao atualizar feed."))}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <Text style={styles.cardStatus}>{item.status ?? "pending"}</Text>
                  <Text style={styles.cardContent}>{item.content}</Text>
                  <Text style={styles.cardMeta}>{(item.tags ?? []).join(", ") || "sem tags"}</Text>
                </View>
              )}
            />
          )}

          {tab === "create" && (
            <ScrollView style={styles.panel} contentContainerStyle={{ gap: 10 }}>
              <TextInput
                style={[styles.input, styles.textArea]}
                multiline
                placeholder="Descreva sua denúncia"
                placeholderTextColor="#a1a1aa"
                value={form.content}
                onChangeText={(v) => setForm((p) => ({ ...p, content: v }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Tags separadas por vírgula"
                placeholderTextColor="#a1a1aa"
                value={form.tags}
                onChangeText={(v) => setForm((p) => ({ ...p, tags: v }))}
              />
              <TouchableOpacity style={styles.primaryBtn} onPress={submitComplaint}>
                <Text style={styles.primaryBtnText}>Publicar denúncia</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {tab === "notifications" && (
            <FlatList
              style={styles.panel}
              data={notifications}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <Text style={styles.cardStatus}>{item.isRead ? "Lida" : "Nova"}</Text>
                  <Text style={styles.cardContent}>{item.title}</Text>
                  <Text style={styles.cardMeta}>{item.message}</Text>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.muted}>Sem notificações.</Text>}
            />
          )}

          {tab === "auth" && (
            <ScrollView style={styles.panel} contentContainerStyle={{ gap: 12 }}>
              <View style={styles.card}>
                <Text style={styles.cardContent}>{user.email}</Text>
                <Text style={styles.cardMeta}>
                  {user.username || "Sem username"} • {user.role || "user"}
                </Text>
              </View>
              <TouchableOpacity style={styles.secondaryBtn} onPress={logout}>
                <Text style={styles.secondaryBtnText}>Sair</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

function TabButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.tabBtn, active && styles.tabBtnActive]}>
      <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#070A12", paddingTop: 16 },
  center: { flex: 1, backgroundColor: "#070A12", alignItems: "center", justifyContent: "center", gap: 12 },
  header: { paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#27272a" },
  brand: { fontSize: 18, fontWeight: "700" },
  brandSmart: { color: "#ef4444", fontSize: 18, fontWeight: "700" },
  brandRest: { color: "#f4f4f5", fontSize: 18, fontWeight: "700" },
  subtitle: { color: "#a1a1aa", marginTop: 2 },
  apiUrl: { color: "#52525b", marginTop: 4, fontSize: 12 },
  panel: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  tabs: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  tabBtn: { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: "#3f3f46", paddingVertical: 8, alignItems: "center" },
  tabBtnActive: { borderColor: "#10b981", backgroundColor: "rgba(16,185,129,0.1)" },
  tabBtnText: { color: "#d4d4d8", fontSize: 12, fontWeight: "600" },
  tabBtnTextActive: { color: "#34d399" },
  card: { backgroundColor: "#111827", borderRadius: 12, borderWidth: 1, borderColor: "#27272a", padding: 12, marginBottom: 10 },
  cardStatus: { color: "#34d399", fontSize: 12, marginBottom: 6, textTransform: "uppercase" },
  cardContent: { color: "#f4f4f5", fontSize: 14, fontWeight: "600" },
  cardMeta: { color: "#a1a1aa", marginTop: 4, fontSize: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#3f3f46",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#f4f4f5",
    backgroundColor: "#09090b",
  },
  textArea: { minHeight: 120, textAlignVertical: "top" },
  primaryBtn: { backgroundColor: "#10b981", borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  primaryBtnText: { color: "#052e2b", fontWeight: "700" },
  secondaryBtn: { borderWidth: 1, borderColor: "#ef4444", borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  secondaryBtnText: { color: "#fca5a5", fontWeight: "700" },
  segment: { flexDirection: "row", borderWidth: 1, borderColor: "#3f3f46", borderRadius: 10, overflow: "hidden" },
  segmentBtn: { flex: 1, alignItems: "center", paddingVertical: 10, backgroundColor: "#09090b" },
  segmentBtnActive: { backgroundColor: "rgba(16,185,129,0.18)" },
  segmentText: { color: "#e4e4e7", fontWeight: "600" },
  error: { color: "#fca5a5", paddingHorizontal: 16, paddingTop: 8 },
  muted: { color: "#a1a1aa" },
});

