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
    
    if datatype == str:
        gen_str = ""
        size = gen(min,max)
        while size>0:
            group = gen(1,5)
            match(group):
                case 1:
                    gen_str+=" "
                case 2:
                    gen_str+=","    
                case 3:
                    gen_str+=chr(65+gen(0,25))
                case 4:
                    gen_str+=chr(97+gen(0,25))
                case 5:
                    gen_str+=chr(49+gen(0,8))
            size-=1
        return gen_str



    