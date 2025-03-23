import math
from tabulate import tabulate # type: ignore
def task(x, eps):
    """
    Function to compute ln(1 - x) approximation using Taylor series expansion by 500 iterations or less and with math funciton

    Args: 
    - x (float): Argument of ln(1 - x)
    - eps (float): Approximate value aim

    Returns:
    - table (tabulate): Table of found values

     Raises:
    - ValueError: If to find answer need more than 500 iterations
    """
    iter = 0
    mn = -1.0
    f = 0
    while eps < abs(mn):
        iter += 1
        if iter > 500:
            raise ValueError(f"Can`t reach eps = {eps} for ln (1-x) by 500 iterations")
        mn *= x
        mn /= iter
        f += mn

    data=[[x, iter, f, math.log(1-x),eps]]
    headers = ["x", "n", "F(x)", "Math F(x)", "eps"]
    table = tabulate(data, headers=headers, floatfmt=".9f")
    return table