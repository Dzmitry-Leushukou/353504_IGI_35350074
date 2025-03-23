def task(lst):
    """
    Function to find absolute minimal value and sum between first and last positive in list

    Args: 
    - lst (list of float): list of float to analyse

     Raises:
    - ValueError: If lst has zero positive elements
    """
    print(f"Absolute minimal element in list: {find_min(lst)}")
    try:
        print(f"Sum between first and last positive element: {find_sum(lst)}")
    except ValueError as e:
        print(f"{e}")
        
    return

def find_min(lst):
    """
    Function to find absolute minimal value in list

    Args: 
    - lst (list of float): list of float to analyse

    Returns:
    - absolute minimal value in
    """
    return min(lst, key=abs)

def find_sum(lst):
    """
    Function to find sum between first and last positive 

    Args: 
    - lst (list of float): list of float to analyse

    Raises:
    - ValueError: If lst has zero positive elements
   
    Returns:
    - sum(float): sum of list elements between first and last
    """
    l = -1
    r = -1
    for i in range(len(lst)):
        if lst[i]>0:
            if l == -1:
                l = i
            r = i
    
    if l==-1 and r==-1:
        raise ValueError("Not enough positive elements (1) to run task")
    
    while l<=r:
        sum=lst[l]
        l+=1

    return sum
