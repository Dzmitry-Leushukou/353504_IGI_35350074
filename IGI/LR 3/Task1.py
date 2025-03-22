import math
from tabulate import tabulate # type: ignore
def task(x, eps):

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