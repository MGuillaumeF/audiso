/**
 * type of single arg of cli
 */
export type CliArgument = string | boolean | number;

/**
 * type of list args of cli
 */
export type CliArguments = string[] | boolean[] | number[];

/**
 * type of one argument of cli
 */
export type ConfigurationItem = {
  /**
   * trigger list of option of cli
   */
  alias: string[];
  /**
   * the description of option's goal
   */
  description: string;
  /**
   * the key of object affected by exploit of cli
   */
  key: string;
  /**
   * the quantity of values expected for option
   */
  quantity: number;
  /**
   * the mandatory properties from cli
   */
  required: boolean;
  /**
   * the type of value expected
   */
  type: "string" | "number" | "boolean";
  /**
   * the value of usable configuration object
   */
  value: CliArgument | CliArguments;
};
