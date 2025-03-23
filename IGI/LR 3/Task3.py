from tabulate import tabulate
def task(str):
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