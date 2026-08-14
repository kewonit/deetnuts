// components/GrainEffect.tsx
import React from "react";
import styles from "./graineffect.module.css";

const GrainEffect: React.FC = () => {
  return (
    <div
      className={styles.grain}
      style={{
        backgroundImage:
          "url(https://res.cloudinary.com/dfyrk32ua/image/upload/v1721326245/deetnuts/pixel_kwxo1f.gif)",
      }}
    />
  );
};

export default GrainEffect;
