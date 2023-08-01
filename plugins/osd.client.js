import OpenSeadragon from 'openseadragon'

export default defineNuxtPlugin((nuxtApp) => {
    return {
      provide: {
        OpenSeadragon,
      },
    };
  });