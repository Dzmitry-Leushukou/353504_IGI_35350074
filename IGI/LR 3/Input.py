import random
def number(min, max, datatype = int):

    while True:
        try:
            val = datatype(input(f"Write number from [{min}; {max}]: "))
            if val > max or val < min:
                raise ValueError(f"The value must be in the interval [{min}; {max}]")
            break
        except ValueError as e:
            print(f"Invalid input. Try again.\nExcpetion: {e}")

    return val

def gen(min, max, datatype = int):
    if datatype == int:
        return random.randint(min,max)

    if datatype == float:
        return random.uniform(min,max)

    