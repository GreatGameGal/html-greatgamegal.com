function map(
  val: number,
  valMin: number,
  valMax: number,
  returnMin: number,
  returnMax: number
) {
  return (
    ((val - valMin) / (valMax - valMin)) * (returnMax - returnMin) + returnMin
  );
}

export { map };
