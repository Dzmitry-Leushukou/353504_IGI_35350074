import Input
import Task1
import Task2
import Task3
import Task4
import Task5

def main_menu():
    """
    Displays the main menu and allows the user to choose a task to execute.

    The menu contains options for five tasks and an option to exit the program.
    The user can select a task by entering the corresponding number.
    """
    while True:
        print("1. Task 1\n2. Task 2\n3. Task 3\n4. Task 4\n5. Task 5\n0. Exit\n")
        i = Input.get("Choose task: ",int,0,5)
        match(i):
            case 0:
                return
            case 1:
                Task1.task1()
            case 2:
                Task2.task2()
            case 3:
                Task3.task3()
            case 4:
                Task4.task4()
            case 5:
                Task5.task5()
