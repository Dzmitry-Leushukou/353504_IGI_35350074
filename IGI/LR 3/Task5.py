def task(lst):
    """
    Function to find sum and multiplication of non-negative numbers stayed between absolute min & max elements

    Args: 
    - lst (list of float): list of float to analyse

     Raises:
    - ValueError: If lst has zero positive elements
    """
    max_elem = max(lst, key=abs)
    min_elem = min(lst, key=abs)


    max_index = lst.index(max_elem)
    min_index = lst.index(min_elem)


    start_index = min(max_index, min_index)+1
    end_index = max(max_index, min_index)
    find_sum(lst[start_index:end_index])
    return

def find_sum(lst):
    """
    Function to find sum and multiplication between first and last positive 

    Args: 
    - lst (list of float): list of float to analyse

    Raises:
    - ValueError: If lst has zero positive elements
   
    Returns:
    - sum(float): sum of list elements between first and last positive
    """
    sum=0
    mul=1
    flag = False
    print(f"Take: {lst}")
    for numb in lst:
        if numb>=0:
            sum+=numb
            mul*=numb
            flag = True
    if flag == False:
        mul=0
    print(f"Sum = {sum}\t Multiply = {mul}")
