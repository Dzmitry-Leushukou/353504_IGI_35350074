import Input
def task(method):
    """
    Function to compute 10000 - a - b while 10000 - a - b not negative

    Args: 
    - method (int): Method to input (1 - manual, 2 - auto)
    """
    while True:
        if method == 1:
            print("Write a(|a|<=100000): ")
            a=Input.number(-100000,100000)
            print("Write b(|b|<=100000): ")
            b=Input.number(-100000,100000)
        else:
            a=Input.gen(-100000,100000)
            b=Input.gen(-100000,100000)
            print(f"a = {a}\nb = {b}")
        result=10000-a-b
        print(f"10000 - {a} - {b} = {result}")
        if result < 0:
            print("Negative result => Task closed")
            break
        
