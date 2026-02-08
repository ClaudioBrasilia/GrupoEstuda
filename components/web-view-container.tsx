import React, { useRef, useState } from "react";
import { View, ActivityIndicator, Alert, Platform, StyleSheet } from "react-native";
import { useColors } from "@/hooks/use-colors";

interface WebViewContainerProps {
  url: string;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: (error: any) => void;
}

// Componente WebView condicional para diferentes plataformas
let WebViewComponent: any = null;

if (Platform.OS !== "web") {
  try {
    WebViewComponent = require("react-native-webview").WebView;
  } catch (e) {
    // WebView não disponível
  }
}

export function WebViewContainer({
  url,
  onLoadStart,
  onLoadEnd,
  onError,
}: WebViewContainerProps) {
  const colors = useColors();
  const webViewRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadStart = () => {
    setIsLoading(true);
    onLoadStart?.();
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
    onLoadEnd?.();
  };

  const handleError = (error: any) => {
    setIsLoading(false);
    onError?.(error);
    Alert.alert("Erro", "Falha ao carregar a página. Verifique sua conexão.");
  };

  // Para plataforma web, usar iframe
  if (Platform.OS === "web") {
    return (
      <View style={styles.container}>
        <iframe
          src={url}
          style={{
            flex: 1,
            width: "100%",
            height: "100%",
            border: "none",
          }}
          title="Grupo Estuda"
          onLoad={handleLoadEnd}
          onError={handleError}
        />
      </View>
    );
  }

  // Para iOS e Android, usar react-native-webview
  if (!WebViewComponent) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // CSS para otimizar visualização mobile
  const mobileOptimizationCSS = `
    * {
      box-sizing: border-box !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      height: 100% !important;
      overflow-x: hidden !important;
    }
    body {
      font-size: 16px !important;
      line-height: 1.5 !important;
    }
    p, span, div, li, a {
      font-size: 16px !important;
    }
    h1 { font-size: 24px !important; }
    h2 { font-size: 20px !important; }
    h3 { font-size: 18px !important; }
    h1, h2, h3, h4, h5, h6 {
      margin: 0.5em 0 !important;
      padding: 0 !important;
      word-wrap: break-word !important;
      overflow-wrap: break-word !important;
      word-break: break-word !important;
    }
    p, span, div, a {
      word-wrap: break-word !important;
      overflow-wrap: break-word !important;
      word-break: break-word !important;
    }
    img {
      max-width: 100% !important;
      height: auto !important;
    }
    button, input, select, textarea {
      font-size: 16px !important;
      padding: 8px 12px !important;
      border-radius: 4px !important;
    }
    /* Fixar menu inferior */
    nav, footer, [role="navigation"], [role="contentinfo"] {
      position: relative !important;
      bottom: auto !important;
      width: 100% !important;
      margin-bottom: 0 !important;
      padding-bottom: 60px !important;
    }
    /* Evitar overflow */
    .container, main, section, article {
      max-width: 100% !important;
      overflow-x: hidden !important;
    }
    /* Garantir visibilidade do botão de envio */
    button[type="submit"], .submit-button, [class*="send"], [class*="upload"] {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      min-height: 44px !important;
      z-index: 9999 !important;
    }
    /* Remover botão Edit with Lovable e marca d'água */
    iframe[src*="lovable.app"], 
    .lovable-badge, 
    #lovable-badge,
    [class*="lovable"],
    [id*="lovable"],
    button:contains("Edit with Lovable"),
    a[href*="lovable.app"] {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
    /* Estilo para botões de alternância do gráfico */
    .chart-toggle-container {
      display: flex;
      justify-content: center;
      gap: 10px;
      margin-bottom: 15px;
    }
    .chart-toggle-btn {
      padding: 8px 16px;
      border-radius: 20px;
      border: 1px solid #007AFF;
      background: white;
      color: #007AFF;
      font-size: 14px;
      font-weight: 600;
    }
    .chart-toggle-btn.active {
      background: #007AFF;
      color: white;
    }
    /* Melhorar espaçamento */
    .tab-bar, [role="tablist"] {
      position: fixed !important;
      bottom: 0 !important;
      left: 0 !important;
      right: 0 !important;
      z-index: 1000 !important;
      width: 100% !important;
      background: white !important;
      border-top: 1px solid #e0e0e0 !important;
      padding-bottom: env(safe-area-inset-bottom) !important;
    }
    body {
      padding-bottom: 120px !important;
    }
    /* Garantir que o container de envio tenha espaço suficiente */
    .activity-upload-container, [class*="upload"], [class*="activity"] {
      padding-bottom: 100px !important;
      margin-bottom: 20px !important;
    }
    /* Forçar o botão de publicar a ficar visível e acima de tudo */
    button[type="submit"], .publish-button, [class*="publish"], [class*="submit"] {
      position: relative !important;
      z-index: 9999 !important;
      margin-bottom: 40px !important;
      display: flex !important;
      visibility: visible !important;
    }
    /* Ocultar navegação interna do site que bloqueia o botão */
    nav, .nav-bar, [role="navigation"], .mobile-nav, .bottom-nav {
      display: none !important;
      height: 0 !important;
      visibility: hidden !important;
    }
    /* Garantir que o formulário ocupe o espaço liberado */
    main, .main-content, #root {
      padding-bottom: 150px !important;
      min-height: 100vh !important;
      display: block !important;
    }
    /* Forçar o botão de publicar a ser visível e clicável */
    button[type="submit"], .publish-button, [class*="publish"], [class*="submit"] {
      position: relative !important;
      z-index: 9999 !important;
      margin: 20px auto !important;
      display: flex !important;
      visibility: visible !important;
      width: 90% !important;
      justify-content: center !important;
      background-color: #007AFF !important;
      color: white !important;
      padding: 15px !important;
      border-radius: 8px !important;
    }
  `;

  const injectedJavaScript = `
    (function() {
      try {
        const style = document.createElement('style');
        style.textContent = \`${mobileOptimizationCSS}\`;
        document.head.appendChild(style);
        
        // Adicionar viewport meta tag se não existir
        if (!document.querySelector('meta[name="viewport"]')) {
          const viewport = document.createElement('meta');
          viewport.name = 'viewport';
          viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
          document.head.appendChild(viewport);
        }
          // Remover overflow da página
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'auto';

        // Remover botão Lovable dinamicamente se o CSS não pegar
        const removeLovable = () => {
          const elements = document.querySelectorAll('button, a, div, span');
          elements.forEach(el => {
            if (el.textContent && el.textContent.includes('Edit with Lovable')) {
              el.style.display = 'none';
            }
          });
          
          // Remover badges específicos
          const badges = document.querySelectorAll('[class*="lovable"], [id*="lovable"]');
          badges.forEach(b => b.style.display = 'none');
        };
        
        removeLovable();
        setTimeout(removeLovable, 1000);
        setTimeout(removeLovable, 3000);

        // Detectar login bem-sucedido e redirecionar se necessário
        const checkLoginStatus = () => {
          const currentUrl = window.location.href;
          const isLoginPage = currentUrl.includes('/login');
          
          // Se estiver na página de login mas houver sinais de que está logado (ex: token no localStorage ou cookies)
          const hasAuthToken = localStorage.getItem('supabase.auth.token') || 
                               document.cookie.includes('sb-') ||
                               document.cookie.includes('app_session_id');
          
          if (isLoginPage && hasAuthToken) {
            console.log('Usuário parece estar logado, redirecionando para home...');
            window.location.href = '/';
          }
        };

        checkLoginStatus();
        setInterval(checkLoginStatus, 2000);

        // Injetar botões de alternância no gráfico de água
        const injectChartToggles = () => {
          if (!window.location.href.includes('/water') && !document.querySelector('.water-page')) return;
          if (document.querySelector('.chart-toggle-container')) return;

          const chartContainer = document.querySelector('.recharts-responsive-container') || document.querySelector('canvas')?.parentElement;
          if (chartContainer) {
            const toggleContainer = document.createElement('div');
            toggleContainer.className = 'chart-toggle-container';
            
            const dailyBtn = document.createElement('button');
            dailyBtn.className = 'chart-toggle-btn active';
            dailyBtn.textContent = 'Diário';
            
            const weeklyBtn = document.createElement('button');
            weeklyBtn.className = 'chart-toggle-btn';
            weeklyBtn.textContent = 'Semanal';
            
            dailyBtn.onclick = () => {
              dailyBtn.classList.add('active');
              weeklyBtn.classList.remove('active');
              // Lógica para mudar dados para diário (simulado ou via trigger se o site suportar)
              console.log('Mudando para visão diária');
            };
            
            weeklyBtn.onclick = () => {
              weeklyBtn.classList.add('active');
              dailyBtn.classList.remove('active');
              // Lógica para mudar dados para semanal
              console.log('Mudando para visão semanal');
            };
            
            toggleContainer.appendChild(dailyBtn);
            toggleContainer.appendChild(weeklyBtn);
            chartContainer.parentElement.insertBefore(toggleContainer, chartContainer);
          }
        };

        setInterval(injectChartToggles, 2000);
      } catch(e) {
        console.error('Erro ao aplicar CSS mobile:', e);
      }
    })();
    true;
  `;

  return (
    <View style={styles.container}>
      <WebViewComponent
        ref={webViewRef}
        source={{ uri: url }}
        style={styles.webView}
        startInLoadingState={true}
        renderLoading={() => (
          <View
            style={[
              styles.loadingContainer,
              { backgroundColor: colors.background },
            ]}
          >
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={false}
        allowsFullscreenVideo={true}
        mediaPlaybackRequiresUserAction={false}
        userAgent="Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36"
        injectedJavaScript={injectedJavaScript}
        injectedJavaScriptBeforeContentLoaded={injectedJavaScript}
        viewportScale={1}
        zoomEnabled={false}
        scrollEnabled={true}
        bounces={false}
        overScrollMode="never"
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        allowsInlineMediaPlayback={true}
        onShowFileChooser={(event) => {
          // Isso permite que o seletor de arquivos nativo do Android/iOS seja aberto corretamente
          return true; 
        }}
        mixedContentMode="always"
        domStorageEnabled={true}
        javaScriptEnabled={true}
        onFileDownload={({ nativeEvent: { downloadUrl } }) => {
          console.log("Download iniciado:", downloadUrl);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  webView: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
