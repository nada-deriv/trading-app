import classNames from "classnames";
import styles from "../styles/buttons.module.scss";

const Button = (props) => {
  return (
    <button
      onClick={(evnt) => props.onClick(evnt)}
      type={props.type ?? "button"}
      disabled={props.disabled}
      class={`${classNames(styles.btn, {
        [styles.primary]: props.category === "primary",
        [styles.secondrary]: props.category === "secondrary",
        [styles.tertiary]: props.category === "tertiary",
        [styles.tertiary_light]: props.category === "teriary_light",
        [styles.flat]: props.category === "flat",
        [styles.trade]: props.category === "trade",
      })}`}
    >
      {props.children}
    </button>
  );
};

export default Button;
