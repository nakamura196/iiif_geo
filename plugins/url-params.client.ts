// URLパラメータの初期化とID選択を管理するプラグイン

export default defineNuxtPlugin((nuxtApp) => {
  const route = useRoute();
  const router = useRouter();
  const { featuresMap, action } = useSettings();
  
  // ID選択の処理を実行
  const processIdSelection = (id: string) => {
    console.log('[Plugin] Processing ID selection:', id);
    
    if (featuresMap.value[id]) {
      const feature = featuresMap.value[id];
      console.log('[Plugin] Found feature for ID:', id);
      
      // actionに設定して地図とビューアの両方を更新
      action.value = {
        type: "both",
        id,
      };
      
      return true;
    }
    return false;
  };
  
  // featuresMapの監視を開始
  const setupIdWatcher = () => {
    const id = route.query.id as string;
    if (!id) return;
    
    let isProcessed = false;
    const maxAttempts = 50; // 最大5秒待機（100ms × 50）
    let attempts = 0;
    
    const checkInterval = setInterval(() => {
      attempts++;
      
      // featuresMapにデータが存在するかチェック
      const hasData = Object.keys(featuresMap.value).length > 0;
      console.log(`[Plugin] Attempt ${attempts}: featuresMap size = ${Object.keys(featuresMap.value).length}`);
      
      if (hasData && !isProcessed) {
        const success = processIdSelection(id);
        if (success) {
          isProcessed = true;
          clearInterval(checkInterval);
          console.log('[Plugin] ID selection completed successfully');
        }
      }
      
      // 最大試行回数に達した場合は停止
      if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        console.warn('[Plugin] Failed to select ID after maximum attempts:', id);
      }
    }, 100);
  };
  
  // ページ読み込み時に実行
  nuxtApp.hook('page:finish', () => {
    setupIdWatcher();
  });
  
  // ルート変更時にも実行
  router.afterEach((to, from) => {
    if (to.query.id && to.query.id !== from.query.id) {
      setupIdWatcher();
    }
  });
});