import Input
def task(method):
    """
    Function to compute amount of even natural number

    Args: 
    - method (int): Method to input (1 - manual, 2 - auto)
    """
    amount = 0
    geni=Input.gen_int(-100000,100000)
    while True:
        a=0
        if method == 1:
            a=Input.number(-100000,100000)
        else:
            a=next(geni)
            print(f"number = {a}")

        if a == 0:
            print(f"Zero result => Task closed\nTotal amount of even natural number: {amount}")
            break

        if a > 0 and a % 2 == 0:
            amount+=1
        
        print(f"Amount of even natural numbers = {amount}")
        
