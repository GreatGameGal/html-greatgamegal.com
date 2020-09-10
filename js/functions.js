function map (val, valMin, valMax, returnMin, returnMax) {
  return (val-valMin)/(valMax-valMin) * (returnMax - returnMin) + returnMin;
}

export {map}