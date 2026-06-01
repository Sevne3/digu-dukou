"use client";
import { createContext, useContext, useState, useEffect } from "react";

var ThemeContext = createContext({ isNight: false, toggle: function() {} });

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider(props) {
  var nightState = useState(false);
  var isNight = nightState[0];
  var setIsNight = nightState[1];

  useEffect(function() {
    var h = new Date().getHours();
    var night = h >= 20 || h < 6;
    setIsNight(night);
    try {
      document.documentElement.setAttribute("data-theme", night ? "night" : "day");
    } catch(e) {}
  }, []);

  function toggle() {
    setIsNight(function(p) { return !p; });
  }

  return (
    <ThemeContext.Provider value={{ isNight: isNight, toggle: toggle }}>
      {props.children}
    </ThemeContext.Provider>
  );
}