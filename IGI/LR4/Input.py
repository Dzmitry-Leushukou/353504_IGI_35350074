def get(text, type, min = None, max = None):
    """
    Prompts the user for input and validates it according to specified rules.

    Parameters:
    - text (str): The prompt text displayed to the user.
    - type (type): The type to which the input should be converted (e.g., int, float).
    - min (int, float, optional): The minimum acceptable value (inclusive).
    - max (int, float, optional): The maximum acceptable value (inclusive).

    Returns:
    - (int, float): A validated input value converted to the specified type.

    Raises:
    - ValueError: If the input cannot be converted to the specified type,
      or if the value is outside the specified range.
    """
    while True:
        try:
            n = type(input(text))
            if (min is None and max is None) or (min is not None and max is not None and min <= n <= max):
                return n
            else:
                raise ValueError(f"value must be in [{min}; {max}]")
        except ValueError as e:
            print(f"Error: {e}.\nEnter a valid value!")

