import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const COLORS = {
  ink: '#182620',
  muted: '#6B7770',
  paper: '#F4F5EF',
  white: '#FFFFFF',
  line: '#DCE1D8',
  green: '#176B4D',
  greenSoft: '#E4F1E9',
  orange: '#B85D2A',
  orangeSoft: '#FAEDE4',
  red: '#B43B35',
  redSoft: '#F9E9E7',
  dark: '#202A25',
};

const ENDPOINTS = [
  { id: 'health', group: 'Sistema', label: 'Estado de la API', method: 'GET', path: '/', body: '', description: 'Comprueba que Express responde.' },
  { id: 'login', group: 'Autenticación', label: 'Iniciar sesión', method: 'POST', path: '/api/login', body: '{\n  "username": "tu_usuario",\n  "password": "tu_contraseña"\n}', description: 'Guarda el token si las credenciales son válidas.' },
  { id: 'register', group: 'Autenticación', label: 'Registrar usuario', method: 'POST', path: '/api/register', body: '{\n  "first_name": "Nombre",\n  "last_name": "Apellido",\n  "username": "usuario_prueba",\n  "email": "prueba@example.com",\n  "password": "cambiar_esta_clave",\n  "role": "user"\n}', description: 'Crea datos reales en la base; úsalo con una cuenta de prueba.' },
  { id: 'profile', group: 'Autenticación', label: 'Mi perfil', method: 'GET', path: '/api/profile', body: '', description: 'Requiere iniciar sesión.' },
  { id: 'services', group: 'Servicios', label: 'Listar servicios', method: 'GET', path: '/api/servicios', body: '', description: 'Lista los servicios publicados.' },
  { id: 'publications', group: 'Publicaciones', label: 'Listar publicaciones', method: 'GET', path: '/api/publicaciones', body: '', description: 'Consulta el contenido técnico publicado.' },
  { id: 'proposal-create', group: 'Propuestas', label: 'Crear propuesta', method: 'POST', path: '/api/propuesta/crear', body: '{\n  "titulo": "Problema de prueba",\n  "sector": "Ganadería",\n  "problematica": "Describe aquí la problemática a resolver."\n}', description: 'Crea una propuesta real; requiere usuario autenticado y sector válido.' },
  { id: 'proposals', group: 'Propuestas', label: 'Propuestas pendientes', method: 'GET', path: '/api/propuestas', body: '', description: 'Requiere autenticación con rol CIT.' },
  { id: 'requests', group: 'Solicitudes', label: 'Listar solicitudes', method: 'GET', path: '/api/solicitudes', body: '', description: 'Devuelve las solicitudes visibles para el usuario.' },
  { id: 'sectors', group: 'Catálogos', label: 'Listar sectores', method: 'GET', path: '/api/sectores', body: '', description: 'Requiere autenticación.' },
  { id: 'states', group: 'Catálogos', label: 'Listar estados', method: 'GET', path: '/api/estados', body: '', description: 'Requiere autenticación.' },
];

const API_DEFAULT = 'http://localhost:3000';

function prettyBody(value) {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

function explainResult(status, expectedStatus, error) {
  if (error) return 'No llegó una respuesta HTTP. Revisa que el backend esté iniciado, la URL y CORS.';
  if (expectedStatus !== undefined) {
    return status === expectedStatus ? 'Resultado esperado para esta comprobación.' : `Se esperaba HTTP ${expectedStatus}; llegó HTTP ${status}.`;
  }
  if (status >= 200 && status < 300) return 'La solicitud se completó correctamente.';
  if (status === 401 || status === 403) return 'La API respondió; verifica el token, las credenciales o el rol requerido.';
  if (status === 404) return 'La API respondió, pero no encontró la ruta o el recurso.';
  if (status >= 500) return 'Error del servidor. Revisa la respuesta y los logs del backend.';
  return 'La API respondió con un error; revisa el detalle devuelto por el backend.';
}

function isPassingResult(result) {
  if (result.error) return false;
  if (result.expectedStatus !== undefined) return result.status === result.expectedStatus;
  return result.status >= 200 && result.status < 300;
}

export default function App() {
  const [width, setWidth] = useState(Dimensions.get('window').width);
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => setWidth(window.width));
    return () => subscription.remove();
  }, []);
  const wide = width >= 900;
  const [baseUrl, setBaseUrl] = useState(API_DEFAULT);
  const [selectedId, setSelectedId] = useState('health');
  const [body, setBody] = useState('');
  const [token, setToken] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connection, setConnection] = useState('idle');
  const selected = ENDPOINTS.find((endpoint) => endpoint.id === selectedId) || ENDPOINTS[0];

  const selectEndpoint = (endpoint) => {
    setSelectedId(endpoint.id);
    setBody(endpoint.body);
  };

  const sendRequest = async ({ method, path, requestBody = '', useToken = true, expectedStatus }) => {
    const startedAt = Date.now();
    const requestUrl = `${baseUrl.trim().replace(/\/+$/, '')}${path}`;
    const headers = {};
    if (requestBody.trim()) headers['Content-Type'] = 'application/json';
    if (useToken && token.trim()) headers.Authorization = `Bearer ${token.trim()}`;

    try {
      const response = await fetch(requestUrl, {
        method,
        headers,
        body: requestBody.trim() ? JSON.stringify(JSON.parse(requestBody)) : undefined,
        signal: AbortSignal.timeout(12000),
      });
      const raw = await response.text();
      let responseBody = raw;
      try {
        responseBody = raw ? JSON.parse(raw) : null;
      } catch {
        responseBody = raw;
      }
      const result = {
        id: `${startedAt}-${Math.random()}`,
        method,
        path,
        status: response.status,
        elapsed: Date.now() - startedAt,
        responseBody,
        requestBody: requestBody.trim() ? JSON.parse(requestBody) : null,
        expectedStatus,
      };
      if (path === '/' && method === 'GET') setConnection(response.ok ? 'online' : 'error');
      if (method === 'POST' && path === '/api/login' && response.ok && responseBody?.token) {
        setToken(responseBody.token);
      }
      setHistory((previous) => [result, ...previous].slice(0, 8));
      return result;
    } catch (error) {
      const result = {
        id: `${startedAt}-${Math.random()}`,
        method,
        path,
        elapsed: Date.now() - startedAt,
        error: error instanceof SyntaxError ? 'El cuerpo no es JSON válido.' : error.message || 'Error de conexión.',
        requestBody: requestBody.trim() ? requestBody : null,
        expectedStatus,
      };
      if (path === '/' && method === 'GET') setConnection('error');
      setHistory((previous) => [result, ...previous].slice(0, 8));
      return result;
    }
  };

  const runSelected = async () => {
    setLoading(true);
    await sendRequest({ method: selected.method, path: selected.path, requestBody: body });
    setLoading(false);
  };

  const runSmokeTest = async () => {
    setLoading(true);
    setConnection('checking');
    await sendRequest({ method: 'GET', path: '/', expectedStatus: 200 });
    await sendRequest({ method: 'GET', path: '/api/profile', useToken: false, expectedStatus: 401 });
    setLoading(false);
  };

  const groupedEndpoints = [...new Set(ENDPOINTS.map((endpoint) => endpoint.group))];
  const lastResult = history[0];

  return (
    <View style={styles.app}>
      <StatusBar style="dark" />
      <View style={styles.topbar}>
        <View style={styles.brandMark}><Text style={styles.brandMarkText}>C</Text></View>
        <View style={styles.brandCopy}>
          <Text style={styles.brandName}>CIT / API</Text>
          <Text style={styles.brandSub}>Consola de pruebas de API</Text>
        </View>
        <View style={[styles.connectionPill, connection === 'online' && styles.connectionOnline, connection === 'error' && styles.connectionError]}>
          <View style={[styles.connectionDot, connection === 'online' && styles.dotOnline, connection === 'error' && styles.dotError]} />
          <Text style={styles.connectionText}>{connection === 'checking' ? 'Comprobando' : connection === 'online' ? 'API disponible' : connection === 'error' ? 'Sin conexión' : 'Sin comprobar'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.page}>
          <View style={styles.intro}>
            <Text style={styles.kicker}>ENTORNO DE DESARROLLO</Text>
            <Text style={styles.heading}>Prueba tu backend.</Text>
            <Text style={styles.introText}>Envía solicitudes al servidor real y revisa estados, tiempos y respuestas.</Text>
          </View>

          <View style={[styles.columns, wide && styles.columnsWide]}>
            <View style={[styles.sidebar, wide && styles.sidebarWide]}>
              <View style={styles.connectionPanel}>
                <Text style={styles.fieldLabel}>URL base del backend</Text>
                <TextInput
                  style={styles.urlInput}
                  value={baseUrl}
                  onChangeText={setBaseUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  placeholder="http://localhost:3000"
                  placeholderTextColor={COLORS.muted}
                />
                <Pressable style={[styles.smokeButton, loading && styles.disabled]} onPress={runSmokeTest} disabled={loading}>
                  {loading ? <ActivityIndicator color={COLORS.white} size="small" /> : <Text style={styles.smokeButtonText}>▶  Ejecutar diagnóstico rápido</Text>}
                </Pressable>
                <Text style={styles.smallNote}>Prueba GET / y confirma que /api/profile exige autenticación.</Text>
              </View>

              <View style={styles.endpointList}>
                <Text style={styles.listHeading}>ENDPOINTS</Text>
                {groupedEndpoints.map((group) => (
                  <View key={group} style={styles.endpointGroup}>
                    <Text style={styles.groupLabel}>{group.toUpperCase()}</Text>
                    {ENDPOINTS.filter((endpoint) => endpoint.group === group).map((endpoint) => {
                      const active = endpoint.id === selectedId;
                      return (
                        <Pressable key={endpoint.id} onPress={() => selectEndpoint(endpoint)} style={[styles.endpointItem, active && styles.endpointActive]}>
                          <View style={styles.endpointTopline}>
                            <Text style={[styles.endpointMethod, endpoint.method === 'GET' ? styles.methodGet : styles.methodPost]}>{endpoint.method}</Text>
                            <Text style={[styles.endpointName, active && styles.endpointNameActive]}>{endpoint.label}</Text>
                          </View>
                          <Text style={styles.endpointPath}>{endpoint.path}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.mainColumn}>
              <View style={styles.requestPanel}>
                <View style={styles.panelHeader}>
                  <View>
                    <Text style={styles.panelEyebrow}>SOLICITUD</Text>
                    <Text style={styles.panelTitle}>{selected.label}</Text>
                  </View>
                  <View style={[styles.methodBadge, selected.method === 'GET' ? styles.getBadge : styles.postBadge]}>
                    <Text style={[styles.methodBadgeText, selected.method === 'GET' ? styles.getBadgeText : styles.postBadgeText]}>{selected.method}</Text>
                  </View>
                </View>
                <Text style={styles.description}>{selected.description}</Text>
                <Text style={styles.fieldLabel}>Ruta</Text>
                <View style={styles.pathField}>
                  <Text style={styles.pathBase}>{baseUrl.trim().replace(/\/+$/, '') || API_DEFAULT}</Text>
                  <Text style={styles.pathRoute}>{selected.path}</Text>
                </View>
                {selected.method !== 'GET' ? (
                  <>
                    <Text style={styles.fieldLabel}>Cuerpo JSON</Text>
                    <TextInput
                      style={styles.bodyInput}
                      value={body}
                      onChangeText={setBody}
                      multiline
                      autoCapitalize="none"
                      autoCorrect={false}
                      spellCheck={false}
                      textAlignVertical="top"
                    />
                  </>
                ) : null}
                <View style={styles.authRow}>
                  <View style={[styles.tokenIndicator, token ? styles.tokenActive : null]} />
                  <Text style={styles.authLabel}>{token ? 'Token Bearer listo' : 'Sin token de autenticación'}</Text>
                  {token ? <Pressable onPress={() => setToken('')}><Text style={styles.clearToken}>Quitar token</Text></Pressable> : null}
                </View>
                <Pressable style={[styles.sendButton, loading && styles.disabled]} onPress={runSelected} disabled={loading}>
                  {loading ? <ActivityIndicator color={COLORS.white} size="small" /> : <Text style={styles.sendButtonText}>Enviar solicitud  →</Text>}
                </Pressable>
              </View>

              <View style={styles.resultsPanel}>
                <View style={styles.resultsHeader}>
                  <View>
                    <Text style={styles.panelEyebrow}>RESPUESTA</Text>
                    <Text style={styles.panelTitle}>Último resultado</Text>
                  </View>
                  {lastResult ? (
                    <View style={[styles.statusBadge, isPassingResult(lastResult) ? styles.statusGood : styles.statusBad]}>
                      <Text style={[styles.statusBadgeText, isPassingResult(lastResult) ? styles.statusGoodText : styles.statusBadText]}>{lastResult.error ? 'ERROR' : `HTTP ${lastResult.status}`}</Text>
                    </View>
                  ) : null}
                </View>
                {lastResult ? (
                  <>
                    <View style={styles.resultMeta}>
                      <Text style={styles.resultRoute}>{lastResult.method}  {lastResult.path}</Text>
                      <Text style={styles.resultTime}>{lastResult.elapsed} ms</Text>
                    </View>
                    <Text style={[styles.diagnostic, lastResult.expectedStatus !== undefined && lastResult.status === lastResult.expectedStatus ? styles.diagnosticGood : null]}>
                      {explainResult(lastResult.status, lastResult.expectedStatus, lastResult.error)}
                    </Text>
                    {lastResult.error ? <Text style={styles.errorDetail}>{lastResult.error}</Text> : null}
                    <Text style={styles.responseLabel}>CUERPO DE RESPUESTA</Text>
                    <ScrollView style={styles.responseBox} nestedScrollEnabled>
                      <Text selectable style={styles.responseText}>{prettyBody(JSON.stringify(lastResult.responseBody ?? null))}</Text>
                    </ScrollView>
                  </>
                ) : (
                  <View style={styles.emptyResult}>
                    <Text style={styles.emptySymbol}>↳</Text>
                    <Text style={styles.emptyText}>Las respuestas del servidor aparecerán aquí.</Text>
                  </View>
                )}
              </View>

              <View style={styles.historyPanel}>
                <View style={styles.historyHeadingRow}>
                  <Text style={styles.panelEyebrow}>ACTIVIDAD RECIENTE</Text>
                  {history.length > 0 ? <Pressable onPress={() => setHistory([])}><Text style={styles.clearHistory}>Limpiar</Text></Pressable> : null}
                </View>
                {history.length ? history.map((item) => (
                  <View key={item.id} style={styles.historyItem}>
                    <View style={[styles.historyMark, isPassingResult(item) ? styles.historyMarkOk : styles.historyMarkError]} />
                    <Text style={styles.historyMethod}>{item.method}</Text>
                    <Text numberOfLines={1} style={styles.historyPath}>{item.path}</Text>
                    <Text style={styles.historyStatus}>{item.error ? 'ERR' : item.status}</Text>
                    <Text style={styles.historyTime}>{item.elapsed} ms</Text>
                  </View>
                )) : <Text style={styles.historyEmpty}>Aún no se enviaron solicitudes.</Text>}
              </View>
            </View>
          </View>
          <Text style={styles.footerNote}>Las solicitudes pueden leer o modificar tu base de datos. Usa datos de prueba.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: COLORS.paper },
  topbar: { minHeight: 70, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: COLORS.line, backgroundColor: COLORS.white },
  brandMark: { width: 36, height: 36, borderRadius: 9, backgroundColor: COLORS.green, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: COLORS.white, fontSize: 22, fontWeight: '800', fontFamily: 'Georgia' },
  brandCopy: { marginLeft: 12, flex: 1 },
  brandName: { color: COLORS.ink, fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  brandSub: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  connectionPill: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderColor: COLORS.line, borderRadius: 20, paddingHorizontal: 11, paddingVertical: 7 },
  connectionOnline: { backgroundColor: COLORS.greenSoft, borderColor: '#BFDAC9' },
  connectionError: { backgroundColor: COLORS.redSoft, borderColor: '#EDC7C3' },
  connectionDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#A8B0AA' },
  dotOnline: { backgroundColor: COLORS.green },
  dotError: { backgroundColor: COLORS.red },
  connectionText: { fontSize: 11, color: COLORS.ink, fontWeight: '700' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40 },
  page: { width: '100%', maxWidth: 1240, alignSelf: 'center' },
  intro: { paddingTop: 34, paddingBottom: 24 },
  kicker: { color: COLORS.orange, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  heading: { color: COLORS.ink, fontSize: 34, lineHeight: 40, fontWeight: '700', fontFamily: 'Georgia', marginTop: 7 },
  introText: { color: COLORS.muted, fontSize: 14, marginTop: 7 },
  columns: { flexDirection: 'column', gap: 18 },
  columnsWide: { flexDirection: 'row', alignItems: 'flex-start' },
  sidebar: { width: '100%' },
  sidebarWide: { width: 300, flexShrink: 0 },
  connectionPanel: { padding: 16, backgroundColor: COLORS.dark, borderRadius: 8 },
  fieldLabel: { color: COLORS.muted, fontSize: 11, fontWeight: '700', marginBottom: 7 },
  urlInput: { minHeight: 40, borderRadius: 5, backgroundColor: '#FFFFFF', paddingHorizontal: 10, color: COLORS.ink, fontSize: 13, marginBottom: 10 },
  smokeButton: { minHeight: 40, borderRadius: 5, backgroundColor: COLORS.green, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  smokeButtonText: { color: COLORS.white, fontWeight: '700', fontSize: 12 },
  smallNote: { color: '#C0C9C3', fontSize: 10, lineHeight: 15, marginTop: 9 },
  endpointList: { paddingTop: 20 },
  listHeading: { color: COLORS.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginBottom: 15 },
  endpointGroup: { marginBottom: 14 },
  groupLabel: { color: COLORS.muted, fontSize: 9, letterSpacing: 1, fontWeight: '800', marginBottom: 6, marginLeft: 2 },
  endpointItem: { paddingVertical: 9, paddingHorizontal: 9, borderRadius: 5, marginBottom: 2, borderWidth: 1, borderColor: 'transparent' },
  endpointActive: { backgroundColor: COLORS.white, borderColor: COLORS.line },
  endpointTopline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  endpointMethod: { width: 34, fontSize: 9, fontWeight: '800' },
  methodGet: { color: COLORS.green },
  methodPost: { color: COLORS.orange },
  endpointName: { color: COLORS.ink, fontSize: 12, fontWeight: '600' },
  endpointNameActive: { fontWeight: '800' },
  endpointPath: { color: COLORS.muted, fontSize: 10, marginLeft: 42, marginTop: 4 },
  mainColumn: { flex: 1, minWidth: 0, gap: 14 },
  requestPanel: { backgroundColor: COLORS.white, borderRadius: 8, borderWidth: 1, borderColor: COLORS.line, padding: 20 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelEyebrow: { color: COLORS.muted, fontSize: 9, letterSpacing: 1.2, fontWeight: '800' },
  panelTitle: { color: COLORS.ink, fontSize: 18, fontWeight: '700', marginTop: 3 },
  methodBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4 },
  getBadge: { backgroundColor: COLORS.greenSoft },
  postBadge: { backgroundColor: COLORS.orangeSoft },
  methodBadgeText: { fontSize: 10, fontWeight: '800' },
  getBadgeText: { color: COLORS.green },
  postBadgeText: { color: COLORS.orange },
  description: { color: COLORS.muted, fontSize: 12, marginTop: 10, marginBottom: 17 },
  pathField: { minHeight: 40, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, backgroundColor: COLORS.paper, borderRadius: 5, marginBottom: 16 },
  pathBase: { color: COLORS.muted, fontSize: 11 },
  pathRoute: { color: COLORS.ink, fontSize: 11, fontWeight: '700' },
  bodyInput: { minHeight: 150, maxHeight: 250, borderWidth: 1, borderColor: COLORS.line, backgroundColor: '#FAFBF8', borderRadius: 5, padding: 12, color: COLORS.ink, fontSize: 12, fontFamily: 'monospace', lineHeight: 18, marginBottom: 12 },
  authRow: { minHeight: 30, flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  tokenIndicator: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#A8B0AA' },
  tokenActive: { backgroundColor: COLORS.green },
  authLabel: { flex: 1, color: COLORS.muted, fontSize: 11 },
  clearToken: { color: COLORS.orange, fontSize: 11, fontWeight: '700' },
  sendButton: { minHeight: 44, borderRadius: 5, backgroundColor: COLORS.green, alignItems: 'center', justifyContent: 'center' },
  sendButtonText: { color: COLORS.white, fontSize: 12, fontWeight: '800' },
  disabled: { opacity: 0.65 },
  resultsPanel: { backgroundColor: COLORS.white, borderRadius: 8, borderWidth: 1, borderColor: COLORS.line, padding: 20 },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 4 },
  statusGood: { backgroundColor: COLORS.greenSoft },
  statusBad: { backgroundColor: COLORS.redSoft },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
  statusGoodText: { color: COLORS.green },
  statusBadText: { color: COLORS.red },
  resultMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.line },
  resultRoute: { color: COLORS.ink, fontSize: 11, fontWeight: '700' },
  resultTime: { color: COLORS.muted, fontSize: 10 },
  diagnostic: { color: COLORS.orange, fontSize: 11, marginTop: 9, lineHeight: 16 },
  diagnosticGood: { color: COLORS.green },
  errorDetail: { color: COLORS.red, fontSize: 11, marginTop: 6 },
  responseLabel: { color: COLORS.muted, fontSize: 9, letterSpacing: 1, fontWeight: '800', marginTop: 16, marginBottom: 7 },
  responseBox: { maxHeight: 190, backgroundColor: COLORS.dark, borderRadius: 5, padding: 12 },
  responseText: { color: '#E4EAE5', fontSize: 11, fontFamily: 'monospace', lineHeight: 17 },
  emptyResult: { minHeight: 105, alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderTopColor: COLORS.line, marginTop: 14 },
  emptySymbol: { color: COLORS.green, fontSize: 22, fontWeight: '700' },
  emptyText: { color: COLORS.muted, fontSize: 12, marginTop: 5 },
  historyPanel: { padding: 17, backgroundColor: COLORS.white, borderRadius: 8, borderWidth: 1, borderColor: COLORS.line },
  historyHeadingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  clearHistory: { color: COLORS.orange, fontSize: 10, fontWeight: '700' },
  historyItem: { minHeight: 33, flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: '#EEF0EB' },
  historyMark: { width: 6, height: 6, borderRadius: 3 },
  historyMarkOk: { backgroundColor: COLORS.green },
  historyMarkError: { backgroundColor: COLORS.red },
  historyMethod: { width: 32, color: COLORS.muted, fontSize: 9, fontWeight: '800' },
  historyPath: { flex: 1, color: COLORS.ink, fontSize: 10 },
  historyStatus: { width: 35, textAlign: 'right', color: COLORS.ink, fontSize: 10, fontWeight: '700' },
  historyTime: { width: 48, textAlign: 'right', color: COLORS.muted, fontSize: 9 },
  historyEmpty: { color: COLORS.muted, fontSize: 11, paddingTop: 5 },
  footerNote: { color: COLORS.muted, fontSize: 10, marginTop: 17, textAlign: 'center' },
});