import random
def number(min, max, datatype = int):
    """
    Function to get user input with data type validation and value range.

    Args:
    - datatype (type): The expected data type for user input (int, float). Defaults to int
    - min (int/float): The minimum allowed value
    - max(int/float): The maximum allowed value

    Returns:
    - val (int/float): The validated user input.

    Raises:
    - ValueError: If the user input does not match the specified data type or falls outside the [min; max] range.
    """

    while True:
        try:
            val = datatype(input(f"Write number from [{min}; {max}]: "))
            if val > max or val < min:
                raise ValueError(f"The value must be in the interval [{min}; {max}]")
            break
        except ValueError as e:
            print(f"Invalid input. Try again.\nExcpetion: {e}")

    return val

def gen_int(min,max):
    rng = [i for i in range(min, max)]
    for i in rng:
         yield i


def gen_float(min,max):
    step = 1000000
    rng = [i for i in range(step + 1)]
    for i in rng:
        yield min + (max - min) * (i / step)

def gen(min, max, datatype = int):
    """
    Function to generate input with data type validation and value range.

    Args:
    - datatype (type): The expected data type for generate input (int, float,str). Defaults to int
    - min (int/float): The minimum allowed value
    - max (int/float): The maximum allowed value

    Returns:
    - generated_value (int/float/str): The validated user input.
    """
    if datatype == int:
        return random.randint(min,max)

    if datatype == float:
        return random.uniform(min,max)
    
    if datatype == str:
        gen_str = ""
        size = random.randint(5,100)
        gent=gen_int(1,1000)
        while size>0:
            group = next(gent)%5+1
            match(group):
                case 1:
                    gen_str+=" "
                case 2:
                    gen_str+=","    
                case 3:
                    gen_str+=chr(65+next(gent)%26)
                case 4:
                    gen_str+=chr(97+next(gent)%26)
                case 5:
                    gen_str+=chr(49+next(gent)%9)
            size-=1
        return gen_str

def input_list():
    """
    Function to get user float list input.

    Returns:
    - lst (list of float): The validated user input.
    """
    lst = []
    print("Size")
    size = number(1,100,int)
    print("Elements of list:")
    while size > 0:
        lst.append(number(-1000000,1000000,float))
        size-=1
    return lst
        

def gen_list():
    """
    Function to generate float list.

    Returns:
    - lst (list of float): The validated list.
    """
    lst = []
    size = random.randint(3,10)
    genCh = gen_int(-3,100000)
    while size > 0:
        lst.append(next(genCh))
        size-=1
    return lst


    