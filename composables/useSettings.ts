export const useSettings = () => {
  const canvas = useState("canvas", () => {});
  const featuresMap = useState("featuresMap", () => {});
  const action = useState("action", () => {});

  return {
    canvas,
    featuresMap,
    action,
  };
};
