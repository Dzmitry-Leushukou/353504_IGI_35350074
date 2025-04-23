def get(text, type, min = None, max = None):
    while True:
        try:
            n = type(input(text))
            if (min is None and max is None) or (min is not None and max is not None and min <= n <= max):
                return n
            else:
                raise ValueError(f"value must be in [{min}; {max}]")
        except ValueError as e:
            print(f"Error: {e}.\nEnter a valid value!")

