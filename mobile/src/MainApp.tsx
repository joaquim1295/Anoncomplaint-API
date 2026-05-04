import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import { apiRequest, API_BASE_URL } from "./api/client";
import { clearToken, getToken, setToken } from "./storage/auth";
import type { Complaint, CompanyPublic, NotificationItem, TopicItem, User } from "./types";

type MainTab = "feed" | "topics" | "search" | "create" | "account" | "auth";
type Detail =
  | null
  | { type: "complaint"; id: string }
  | { type: "topic"; slug: string; title?: string }
  | { type: "company"; slug: string };

const WEB_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, "");

export function MainApp() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<MainTab>("feed");
  const [detail, setDetail] = useState<Detail>(null);

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [topicComplaints, setTopicComplaints] = useState<Complaint[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activities, setActivities] = useState<Complaint[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<Complaint[]>([]);
  const [complaintDetail, setComplaintDetail] = useState<Complaint | null>(null);
  const [companyDetail, setCompanyDetail] = useState<CompanyPublic | null>(null);
  const [companyComplaints, setCompanyComplaints] = useState<Complaint[]>([]);

  const [form, setForm] = useState({ title: "", content: "", tags: "" });
  const [authForm, setAuthForm] = useState({
    mode: "login" as "login" | "register",
    emailOrUsername: "",
    email: "",
    username: "",
    password: "",
  });

  const title = useMemo(() => {
    if (!user && tab === "auth") return "Entrar";
    if (!user) return tab === "topics" ? "Tópicos" : tab === "search" ? "Pesquisa" : "Feed público";
    if (tab === "topics") return "Tópicos";
    if (tab === "search") return "Pesquisa";
    if (tab === "create") return "Nova denúncia";
    if (tab === "account") return "Conta";
    return "Feed";
  }, [tab, user]);

  const loadPublicFeed = useCallback(async () => {
    const data = await apiRequest<Complaint[]>("/complaints?page=1&limit=25");
    setComplaints(data);
  }, []);

  const loadFeed = useCallback(async () => {
    const data = await apiRequest<Complaint[]>("/complaints?page=1&limit=25", { auth: true });
    setComplaints(data);
  }, []);

  const loadCurrentUser = useCallback(async () => {
    const me = await apiRequest<User>("/auth/me", { auth: true });
    setUser(me);
  }, []);

  const loadTopics = useCallback(async () => {
    const data = await apiRequest<TopicItem[]>("/topics");
    setTopics(Array.isArray(data) ? data : []);
  }, []);

  const loadTopicFeed = useCallback(async (slug: string) => {
    const enc = encodeURIComponent(slug);
    const data = await apiRequest<Complaint[]>(`/complaints?page=1&limit=30&topic=${enc}`);
    setTopicComplaints(data);
  }, []);

  const loadNotifications = useCallback(async () => {
    const data = await apiRequest<NotificationItem[]>("/notifications?page=1&limit=40", { auth: true });
    setNotifications(data);
  }, []);

  const loadActivities = useCallback(async () => {
    const data = await apiRequest<Complaint[]>("/complaints?page=1&limit=40&author=me", { auth: true });
    setActivities(data);
  }, []);

  const bootstrap = useCallback(async () => {
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
      setError(e instanceof Error ? e.message : "Erro ao iniciar.");
    } finally {
      setLoading(false);
    }
  }, [loadCurrentUser, loadFeed, loadPublicFeed]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (user && tab === "auth") setTab("feed");
  }, [user, tab]);

  useEffect(() => {
    if (tab === "topics") {
      loadTopics().catch((e) => setError(e instanceof Error ? e.message : "Erro em tópicos."));
    }
  }, [tab, loadTopics]);

  useEffect(() => {
    if (tab === "account" && user) {
      void loadNotifications();
      void loadActivities();
    }
  }, [tab, user, loadNotifications, loadActivities]);

  useEffect(() => {
    if (!detail) {
      setComplaintDetail(null);
      setCompanyDetail(null);
      setCompanyComplaints([]);
      return;
    }
    if (detail.type === "complaint") {
      void (async () => {
        try {
          const c = await apiRequest<Complaint>(`/complaints/${detail.id}`, { auth: Boolean(await getToken()) });
          setComplaintDetail(c);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Erro ao abrir denúncia.");
        }
      })();
    }
    if (detail.type === "topic") {
      void loadTopicFeed(detail.slug);
    }
    if (detail.type === "company") {
      void (async () => {
        try {
          const enc = encodeURIComponent(detail.slug);
          const co = await apiRequest<CompanyPublic>(`/company/public/${enc}`);
          setCompanyDetail(co);
          const list = await apiRequest<Complaint[]>(`/complaints?page=1&limit=25&company=${encodeURIComponent(co.id)}`);
          setCompanyComplaints(list);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Erro ao abrir empresa.");
        }
      })();
    }
  }, [detail, loadTopicFeed]);

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
        const result = await apiRequest<{ token?: string } & User>("/auth/register", {
          method: "POST",
          body: JSON.stringify({
            email: authForm.email,
            username: authForm.username || undefined,
            password: authForm.password,
          }),
        });
        if (result.token) await setToken(result.token);
      }
      await Promise.all([loadCurrentUser(), loadFeed()]);
      setTab("feed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no login/registo.");
    }
  }

  async function submitComplaint() {
    const t = form.title.trim();
    const c = form.content.trim();
    if (t.length < 1) {
      setError("Indique um título.");
      return;
    }
    if (c.length < 10) {
      setError("A descrição deve ter pelo menos 10 caracteres.");
      return;
    }
    setError(null);
    try {
      await apiRequest("/complaints", {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          title: t,
          content: c,
          tags: form.tags
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          ghost_mode: false,
        }),
      });
      setForm({ title: "", content: "", tags: "" });
      setTab("feed");
      await loadFeed();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao criar denúncia.");
    }
  }

  async function runSearch() {
    const q = searchQ.trim();
    if (q.length < 2) {
      setError("Pesquisa muito curta.");
      return;
    }
    setError(null);
    try {
      const enc = encodeURIComponent(q);
      const data = await apiRequest<Complaint[]>(`/complaints/search?q=${enc}&page=1&limit=30`);
      setSearchResults(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha na pesquisa.");
    }
  }

  async function logout() {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, { method: "POST", headers: await authHeaders() });
    } catch {
      /* ignore */
    }
    await clearToken();
    setUser(null);
    setTab("feed");
    setDetail(null);
    await loadPublicFeed();
  }

  async function authHeaders(): Promise<Headers> {
    const h = new Headers();
    const t = await getToken();
    if (t) h.set("Authorization", `Bearer ${t}`);
    return h;
  }

  function openWeb(path: string) {
    const url = `${WEB_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
    void WebBrowser.openBrowserAsync(url);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center} edges={["top", "right", "left", "bottom"]}>
        <StatusBar style="light" />
        <ActivityIndicator color="#10b981" />
        <Text style={styles.muted}>A carregar…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "right", "left", "bottom"]}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.brand}>
          <Text style={styles.brandSmart}>Smart</Text>
          <Text style={styles.brandRest}>Complaint</Text>
        </Text>
        <Text style={styles.subtitle}>{title}</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!user ? (
        <>
          <View style={styles.tabs}>
            <TabButton active={tab === "feed"} label="Feed" onPress={() => setTab("feed")} />
            <TabButton active={tab === "topics"} label="Tópicos" onPress={() => setTab("topics")} />
            <TabButton active={tab === "search"} label="Pesquisa" onPress={() => setTab("search")} />
            <TabButton active={tab === "auth"} label="Entrar" onPress={() => setTab("auth")} />
          </View>

          {tab === "feed" && (
            <FlatList
              style={styles.panel}
              data={complaints}
              keyExtractor={(item) => item.id}
              onRefresh={() => loadPublicFeed().catch((e) => setError(e instanceof Error ? e.message : "Erro."))}
              refreshing={false}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.card} onPress={() => setDetail({ type: "complaint", id: item.id })} activeOpacity={0.85}>
                  <Text style={styles.cardStatus}>{item.status ?? "pending"}</Text>
                  {item.title ? <Text style={styles.cardTitle}>{item.title}</Text> : null}
                  <Text style={styles.cardContent} numberOfLines={4}>
                    {item.content}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}

          {tab === "topics" && (
            <FlatList
              style={styles.panel}
              data={topics}
              keyExtractor={(item) => item.slug}
              ListEmptyComponent={<Text style={styles.muted}>Sem tópicos.</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.card} onPress={() => setDetail({ type: "topic", slug: item.slug, title: item.title })}>
                  <Text style={styles.cardTitle}>/{item.slug}</Text>
                  <Text style={styles.cardMeta}>{item.title}</Text>
                </TouchableOpacity>
              )}
            />
          )}

          {tab === "search" && (
            <ScrollView style={styles.panel} contentContainerStyle={{ gap: 12 }}>
              <TextInput
                style={styles.input}
                placeholder="Pesquisar denúncias…"
                placeholderTextColor="#a1a1aa"
                value={searchQ}
                onChangeText={setSearchQ}
                onSubmitEditing={runSearch}
              />
              <TouchableOpacity style={styles.primaryBtn} onPress={runSearch}>
                <Text style={styles.primaryBtnText}>Pesquisar</Text>
              </TouchableOpacity>
              <FlatList
                scrollEnabled={false}
                data={searchResults}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.card} onPress={() => setDetail({ type: "complaint", id: item.id })}>
                    <Text style={styles.cardContent} numberOfLines={3}>
                      {item.title ? `${item.title} — ` : ""}
                      {item.content}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </ScrollView>
          )}

          {tab === "auth" && (
            <ScrollView style={styles.panel} contentContainerStyle={{ gap: 10, paddingBottom: 24 }}>
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
                  <Text style={styles.segmentText}>Registo</Text>
                </TouchableOpacity>
              </View>

              {authForm.mode === "login" ? (
                <TextInput
                  style={styles.input}
                  placeholder="Email ou utilizador"
                  placeholderTextColor="#a1a1aa"
                  autoCapitalize="none"
                  value={authForm.emailOrUsername}
                  onChangeText={(v) => setAuthForm((p) => ({ ...p, emailOrUsername: v }))}
                />
              ) : (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#a1a1aa"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={authForm.email}
                    onChangeText={(v) => setAuthForm((p) => ({ ...p, email: v }))}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Utilizador (opcional)"
                    placeholderTextColor="#a1a1aa"
                    autoCapitalize="none"
                    value={authForm.username}
                    onChangeText={(v) => setAuthForm((p) => ({ ...p, username: v }))}
                  />
                </>
              )}
              <TextInput
                secureTextEntry
                style={styles.input}
                placeholder="Palavra-passe"
                placeholderTextColor="#a1a1aa"
                value={authForm.password}
                onChangeText={(v) => setAuthForm((p) => ({ ...p, password: v }))}
              />
              <TouchableOpacity style={styles.primaryBtn} onPress={submitAuth}>
                <Text style={styles.primaryBtnText}>Continuar</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </>
      ) : (
        <>
          <View style={styles.tabs}>
            <TabButton active={tab === "feed"} label="Feed" onPress={() => setTab("feed")} />
            <TabButton active={tab === "topics"} label="Tópicos" onPress={() => setTab("topics")} />
            <TabButton active={tab === "search"} label="Pesquisa" onPress={() => setTab("search")} />
            <TabButton active={tab === "create"} label="Nova" onPress={() => setTab("create")} />
            <TabButton active={tab === "account"} label="Conta" onPress={() => setTab("account")} />
          </View>

          {tab === "feed" && (
            <FlatList
              style={styles.panel}
              data={complaints}
              keyExtractor={(item) => item.id}
              refreshing={false}
              onRefresh={() => loadFeed().catch((e) => setError(e instanceof Error ? e.message : "Erro ao atualizar."))}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <TouchableOpacity activeOpacity={0.85} onPress={() => setDetail({ type: "complaint", id: item.id })}>
                    <Text style={styles.cardStatus}>{item.status ?? "pending"}</Text>
                    {item.title ? <Text style={styles.cardTitle}>{item.title}</Text> : null}
                    <Text style={styles.cardContent} numberOfLines={4}>
                      {item.content}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.cardRow}>
                    {item.companyName ? (
                      <TouchableOpacity
                        onPress={() => {
                          const slug =
                            (item.companySlug ?? "").trim() ||
                            item.companyName!.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                          setDetail({ type: "company", slug });
                        }}
                      >
                        <Text style={styles.link}>{item.companyName}</Text>
                      </TouchableOpacity>
                    ) : null}
                    {item.topic_slug ? (
                      <TouchableOpacity onPress={() => setDetail({ type: "topic", slug: item.topic_slug!, title: item.topic_slug! })}>
                        <Text style={styles.linkMuted}>/{item.topic_slug}</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              )}
            />
          )}

          {tab === "topics" && (
            <FlatList
              style={styles.panel}
              data={topics}
              keyExtractor={(item) => item.slug}
              ListEmptyComponent={<Text style={styles.muted}>Sem tópicos. Puxe para atualizar.</Text>}
              refreshing={false}
              onRefresh={() => loadTopics().catch(() => undefined)}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.card} onPress={() => setDetail({ type: "topic", slug: item.slug, title: item.title })}>
                  <Text style={styles.cardTitle}>/{item.slug}</Text>
                  <Text style={styles.cardMeta}>{item.title}</Text>
                  {typeof item.complaint_count === "number" ? (
                    <Text style={styles.cardMeta}>{item.complaint_count} denúncias</Text>
                  ) : null}
                </TouchableOpacity>
              )}
            />
          )}

          {tab === "search" && (
            <ScrollView style={styles.panel} contentContainerStyle={{ gap: 12 }}>
              <TextInput
                style={styles.input}
                placeholder="Palavras-chave (título, texto, tags)…"
                placeholderTextColor="#a1a1aa"
                value={searchQ}
                onChangeText={setSearchQ}
                onSubmitEditing={runSearch}
              />
              <TouchableOpacity style={styles.primaryBtn} onPress={runSearch}>
                <Text style={styles.primaryBtnText}>Pesquisar</Text>
              </TouchableOpacity>
              <FlatList
                scrollEnabled={false}
                data={searchResults}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.card} onPress={() => setDetail({ type: "complaint", id: item.id })}>
                    <Text style={styles.cardContent} numberOfLines={3}>
                      {item.title ? `${item.title} — ` : ""}
                      {item.content}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </ScrollView>
          )}

          {tab === "create" && (
            <ScrollView style={styles.panel} contentContainerStyle={{ gap: 10 }}>
              <TextInput
                style={styles.input}
                placeholder="Título (obrigatório)"
                placeholderTextColor="#a1a1aa"
                value={form.title}
                onChangeText={(v) => setForm((p) => ({ ...p, title: v }))}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                multiline
                placeholder="Descrição (mín. 10 caracteres)"
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
                <Text style={styles.primaryBtnText}>Publicar</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {tab === "account" && (
            <ScrollView style={styles.panel} contentContainerStyle={{ gap: 14 }}>
              <View style={styles.card}>
                <Text style={styles.cardContent}>{user.email}</Text>
                <Text style={styles.cardMeta}>
                  {user.username || "—"} • {user.role || "user"}
                </Text>
              </View>

              <Text style={styles.sectionLabel}>No browser (site completo)</Text>
              <RowLink label="Mapa" onPress={() => openWeb("/mapa")} />
              <RowLink label="Caixa de entrada" onPress={() => openWeb("/inbox")} />
              <RowLink label="Painel empresa" onPress={() => openWeb("/dashboard-empresa")} />
              <RowLink label="Estatísticas" onPress={() => openWeb("/analytics")} />
              {user.role === "admin" ? <RowLink label="Relatório técnico" onPress={() => openWeb("/relatorio")} /> : null}
              <RowLink label="Documentação API" onPress={() => openWeb("/api-docs")} />

              <Text style={styles.sectionLabel}>Notificações</Text>
              {notifications.map((n) => (
                <View key={n.id} style={styles.card}>
                  <Text style={styles.cardStatus}>{n.isRead ? "Lida" : "Nova"}</Text>
                  <Text style={styles.cardTitle}>{n.title}</Text>
                  <Text style={styles.cardMeta}>{n.message}</Text>
                  {n.complaintId ? (
                    <TouchableOpacity onPress={() => setDetail({ type: "complaint", id: n.complaintId! })}>
                      <Text style={styles.link}>Abrir denúncia</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}
              {notifications.length === 0 ? <Text style={styles.muted}>Sem notificações.</Text> : null}

              <Text style={styles.sectionLabel}>As minhas denúncias</Text>
              {activities.map((c) => (
                <TouchableOpacity key={c.id} style={styles.card} onPress={() => setDetail({ type: "complaint", id: c.id })}>
                  <Text style={styles.cardTitle}>{c.title || "Sem título"}</Text>
                  <Text style={styles.cardMeta} numberOfLines={2}>
                    {c.content}
                  </Text>
                </TouchableOpacity>
              ))}
              {activities.length === 0 ? <Text style={styles.muted}>Ainda sem denúncias com esta conta.</Text> : null}

              <TouchableOpacity style={styles.secondaryBtn} onPress={logout}>
                <Text style={styles.secondaryBtnText}>Sair</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </>
      )}

      <Modal visible={detail !== null} animationType="slide" onRequestClose={() => setDetail(null)}>
        <SafeAreaView style={styles.modal} edges={["top", "right", "left", "bottom"]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setDetail(null)}>
              <Text style={styles.link}>← Voltar</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
            {detail?.type === "complaint" && complaintDetail ? (
              <>
                <Text style={styles.cardTitle}>{complaintDetail.title || "Denúncia"}</Text>
                <Text style={styles.cardMeta}>{complaintDetail.status}</Text>
                <Text style={styles.modalBody}>{complaintDetail.content}</Text>
                {complaintDetail.companyName && complaintDetail.companySlug ? (
                  <TouchableOpacity onPress={() => setDetail({ type: "company", slug: complaintDetail.companySlug! })}>
                    <Text style={styles.link}>Empresa: {complaintDetail.companyName}</Text>
                  </TouchableOpacity>
                ) : null}
              </>
            ) : null}
            {detail?.type === "topic" ? (
              <>
                <Text style={styles.cardTitle}>/{detail.slug}</Text>
                <Text style={styles.cardMeta}>{detail.title}</Text>
                {topicComplaints.map((c) => (
                  <TouchableOpacity key={c.id} style={styles.card} onPress={() => setDetail({ type: "complaint", id: c.id })}>
                    <Text style={styles.cardContent} numberOfLines={3}>
                      {c.content}
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            ) : null}
            {detail?.type === "company" && companyDetail ? (
              <>
                <Text style={styles.cardTitle}>{companyDetail.name}</Text>
                <Text style={styles.cardMeta}>/{companyDetail.slug}</Text>
                {companyDetail.description ? <Text style={styles.modalBody}>{companyDetail.description}</Text> : null}
                {companyComplaints.map((c) => (
                  <TouchableOpacity key={c.id} style={styles.card} onPress={() => setDetail({ type: "complaint", id: c.id })}>
                    <Text style={styles.cardContent} numberOfLines={3}>
                      {c.title ? `${c.title} — ` : ""}
                      {c.content}
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            ) : null}
            {detail && detail.type === "complaint" && !complaintDetail ? <ActivityIndicator color="#10b981" /> : null}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function TabButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.tabBtn, active && styles.tabBtnActive]}>
      <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function RowLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.rowLink} onPress={onPress}>
      <Text style={styles.link}>{label}</Text>
      <Text style={styles.chev}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#070A12" },
  center: { flex: 1, backgroundColor: "#070A12", alignItems: "center", justifyContent: "center", gap: 12 },
  header: { paddingHorizontal: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "#27272a" },
  brand: { fontSize: 18, fontWeight: "700" },
  brandSmart: { color: "#ef4444", fontSize: 18, fontWeight: "700" },
  brandRest: { color: "#f4f4f5", fontSize: 18, fontWeight: "700" },
  subtitle: { color: "#a1a1aa", marginTop: 2 },
  panel: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  tabs: { flexDirection: "row", gap: 4, paddingHorizontal: 8, paddingTop: 8, flexWrap: "nowrap" },
  tabBtn: { flex: 1, minWidth: 0, borderRadius: 10, borderWidth: 1, borderColor: "#3f3f46", paddingVertical: 8, paddingHorizontal: 2, alignItems: "center" },
  tabBtnActive: { borderColor: "#10b981", backgroundColor: "rgba(16,185,129,0.1)" },
  tabBtnText: { color: "#d4d4d8", fontSize: 11, fontWeight: "600", textAlign: "center" },
  tabBtnTextActive: { color: "#34d399" },
  card: { backgroundColor: "#111827", borderRadius: 12, borderWidth: 1, borderColor: "#27272a", padding: 12, marginBottom: 10 },
  cardStatus: { color: "#34d399", fontSize: 11, marginBottom: 4, textTransform: "uppercase" },
  cardTitle: { color: "#f4f4f5", fontSize: 15, fontWeight: "700", marginBottom: 4 },
  cardContent: { color: "#e4e4e7", fontSize: 14 },
  cardMeta: { color: "#a1a1aa", marginTop: 4, fontSize: 12 },
  cardRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  link: { color: "#6ee7b7", fontSize: 13, fontWeight: "600" },
  linkMuted: { color: "#a78bfa", fontSize: 12 },
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
  secondaryBtn: { borderWidth: 1, borderColor: "#ef4444", borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 8 },
  secondaryBtnText: { color: "#fca5a5", fontWeight: "700" },
  segment: { flexDirection: "row", borderWidth: 1, borderColor: "#3f3f46", borderRadius: 10, overflow: "hidden" },
  segmentBtn: { flex: 1, alignItems: "center", paddingVertical: 10, backgroundColor: "#09090b" },
  segmentBtnActive: { backgroundColor: "rgba(16,185,129,0.18)" },
  segmentText: { color: "#e4e4e7", fontWeight: "600" },
  error: { color: "#fca5a5", paddingHorizontal: 16, paddingTop: 6 },
  muted: { color: "#a1a1aa" },
  sectionLabel: { color: "#71717a", fontSize: 11, fontWeight: "700", textTransform: "uppercase", marginTop: 4 },
  rowLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#27272a",
  },
  chev: { color: "#52525b", fontSize: 18 },
  modal: { flex: 1, backgroundColor: "#070A12" },
  modalHeader: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#27272a" },
  modalBody: { color: "#d4d4d8", fontSize: 14, lineHeight: 22 },
});
