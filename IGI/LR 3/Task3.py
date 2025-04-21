from tabulate import tabulate

def task(str):
    """
    Function to compute amount of puncto sign in string

    Args: 
    - str (str): string to analyse

    Returns:
    - kol(dictionary): dictionary
    """
    kol = {}
    for char in str:
        if char == '!' or char == ',' or char == '.' or char == '?'or char == ';'or char == ':':
            if char in kol:
                kol[char]+=1
            else:
                kol[char]=1
    data = [[key, kol[key]] for key in kol.keys()]
    headers = ["puncto", "amount"]
    table = tabulate(data, headers=headers)
    return table