import math
from tabulate import tabulate
from decimal import Decimal

def task(x, eps):
    """
    Function to compute sin(x) approximation using Taylor series expansion by 500 iterations or less and with math function.

    Args: 
    - x (float): Argument of sin(x)
    - eps (float): Approximate value aim

    Returns:
    - table (tabulate): Table of found values

    Raises:
    - ValueError: If to find answer need more than 500 iterations
    """

    iter = 0
    sign = 1  
    approximation = Decimal(0)
    term = Decimal(2)

    while abs(term) >= Decimal(eps): 
        term = Decimal(sign) * (Decimal(x) ** (2 * iter + 1)) / Decimal(math.factorial(2 * iter + 1))
        sign *= -1 
        approximation += term
        iter += 1
        if iter > 500:
            raise ValueError(f"Can't reach eps = {eps} for sin(x) by 500 iterations")


    data = [[x, iter, float(approximation), math.sin(x), eps]]
    headers = ["x", "n", "F(x)", "Math F(x)", "eps"]
    table = tabulate(data, headers=headers)
    return table
