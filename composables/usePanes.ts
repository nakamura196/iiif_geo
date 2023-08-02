/*
type Pane = {
    
}
*/

type PanesConfig = {
    /*
      [key: string]: {
          label: string;
  
      }
    */
      id: string;
    label: string;
  }
  
  export const usePanes = () => {
    
      // const items = useState("items", () => [] as any);
    
      const settings = useState("settings", () => ({
        data: {
          xmlString: "",
          tei: null,
        },
        panes: []
      }));
  
      const panesConfig = useState<PanesConfig[]>("panesConfig", () => ([]));
    
      return {
        // items,
        settings,
        panesConfig
      };
    };
    