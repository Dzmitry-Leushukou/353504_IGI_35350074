import Task1
import Task2
import Task3
import Task4
import Task5
import Input

def menu():
    while True:
        print("==Menu==")
        print("Choose task:")
        print("1. Task 1")
        print("2. Task 2")
        print("3. Task 3")
        print("4. Task 4")
        print("5. Task 5")
        print("0. Exit")

        n = Input.number(0,5)

        if n==0:
            return
        
        print("Choose input method")
        print("1. Manual")
        print("2. Auto (random data)")
        method = Input.number(1,2)


        match n:
            case 1:
                task1(method)
            case 2:
                task2(method)
            case 3:
                task3(method)
            case 4:
                task4(method)
            case 5:
                task5(method)

def task1(method):
    print("This task find value of ln(1 - x) with eps precise")
    eps = 0
    x = 0
    if method == 2:
        eps = Input.gen(-0.999999999999,0.999999999999,float)
        x = Input.gen(0,1,float)
        print(f"x: {x}")
        print(f"eps: {eps}") 
    else:
        print("x")
        x = Input.number(-0.999999999999,0.999999999999,float)
        print("eps")
        eps = Input.number(0,1,float)
    try:
        print(Task1.task(x,eps)) 
        print("\n")
    except ValueError as e:
        print(f"ERROR: {e}")

def task2(method):
    print("10000 - a - b. For exit result must be negative")
    Task2.task(method)
    return

def task3(method):
    s = ""
    if(method == 1):
        s = input("Write string: ")
    if(method == 2):
        s = Input.gen(1,150,str)
        print(s)
    print(Task3.task(s))
    return

def task4(method):
    return

def task5(method):
    return
