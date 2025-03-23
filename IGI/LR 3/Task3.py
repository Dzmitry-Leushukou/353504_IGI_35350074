from tabulate import tabulate

def task(str):
    """
    Function to compute amount of ',' and '.' in string

    Args: 
    - str (str): string to analyse

    Returns:
    - table (tabulate): Table of found values
    """
    spaces = 0
    commas = 0
    for char in str:
        if char == ' ':
            spaces+=1
        if char == ',':
            commas+=1
    data=[[spaces, commas]]
    headers = ["spaces", "commas"]
    table = tabulate(data, headers=headers)
    return table