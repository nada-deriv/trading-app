import classNames from "classnames";
import styles from "../styles/buttons.module.scss";

const Button = (props) => {
  return (
    <button
      onClick={(evnt) => props.onClick(evnt)}
      type={props.type ?? "button"}
      disabled={props.disabled}
      class={`${classNames(styles.btn, {
        [styles.primary]: props.type === "primary",
        [styles.secondrary]: props.type === "secondrary",
        [styles.tertiary]: props.type === "tertiary",
        [styles.tertiary_light]: props.type === "teriary_light",
        [styles.flat]: props.type === "flat",
        [styles.trade]: props.type === "trade",
        [styles.reset]: props.type === "reset",
      })}`}
    >
      {props.children}
    </button>
  );
};

export default Button;
