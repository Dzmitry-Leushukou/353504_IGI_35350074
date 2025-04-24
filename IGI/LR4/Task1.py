import Input
import Utils
import csv
import pickle

def task1():
    """
    Main function to manage a list of musicians with various operations.
    
    Features:
    - Add a musician to the list.
    - Show the list of musicians.
    - Sort the list of musicians.
    - Find musicians by instrument.
    - Save and load the list to/from CSV and pickle files.
    """
    musicians = []
    while True:
        print("1. Add musician to the list\n2. Show list of musicians\n3. Sort musicians list\n4. Find a musician by musical genre")
        print("5. Save to CSV\n6. Load from CSV")
        print("7. Save to pickle\n8. Load from pickle\n0. Exit")
        i = Input.get("Choose operation: ",int, 0, 8)
        match(i):
            case 0:
                return
            case 1:
                surname = Input.get("Write surname: ", str)
                instrument = Input.get("Write instrument: ", str)
                musicians.append(MusicianApplicant(surname, instrument))
                print("Your application has been successfully accepted!")
                print(musicians[-1]._to_string())
            case 2:
                print("===Applicant list===")
                for m in musicians:
                    print(f"Surname : {m.surname}")
                    print(f"Instrument: {m.instrument}")
                    print(f"--------------------------------")
                print(f"==================================")
            case 3:
                Utils.utils.sort_applicants(musicians)
                print(f"List was sorted")
            case 4:
                target = Input.get("Write target instument: ",str)
                founded = []
                for m in musicians:
                    if m.instrument == target:
                        founded.append(m)
                
                print(f"Found: {len(founded)}\n")
                ind = 0
                for f in founded:
                    print(f"[{ind}]\n{f._to_string()}")
                    ind+=1
    
            case 5:
                save_to_csv(musicians)
            case 6:
                musicians = load_from_csv()
            case 7:
                save_to_pickle(musicians)
            case 8:
                musicians = load_from_pickle()


def save_to_csv(musicians):
    """
    Saves the list of musicians to a CSV file.
    
    Parameters:
    - musicians (list): A list of MusicianApplicant objects.
    """
    try:
        with open("musician.csv", mode="w", newline="") as file:
            writer = csv.writer(file)
            writer.writerow(["Surname", "Instrument"])
            for musician in musicians:
                writer.writerow([musician.surname, musician.instrument])
        print("Data saved in musician.csv.")
    except Exception as e:
        print(f"Can`s save data [{e}]")

def load_from_csv():
    """
    Loads the list of musicians from a CSV file.
    
    Returns:
    - list: A list of MusicianApplicant objects.
    """
    try:
        with open("musician.csv", mode="r") as file:
            reader = csv.reader(file)
            next(reader) # header skip
            musician_list = []
            for row in reader:
                if row: # if not empty
                    musician_list.append(MusicianApplicant(row[0].strip(), row[1].strip()))
    except FileNotFoundError:
        print("musician.csv not found")
    except Exception as e:
        print(f"Can`t load [{e}]")
    return musician_list

def save_to_pickle(musician_list):
    """
    Saves the list of musicians to a pickle file.
    
    Parameters:
    - musician_list (list): A list of MusicianApplicant objects.
    """
    try:
        with open("musicians.pkl", mode="wb") as file:
            pickle.dump(musician_list, file)
        print("Data saved in musician.pkl.")
    except Exception as e:
        print(f"Can`s save data [{e}]")

def load_from_pickle():
    """
    Loads the list of musicians from a pickle file.
    
    Returns:
    - list: A list of MusicianApplicant objects.
    """
    try:
        with open("musicians.pkl", mode="rb") as file:
            musician_list = pickle.load(file)
    except FileNotFoundError:
        print("Файл musicians.pkl не найден.")
    except Exception as e:
        print(f"Can`t load [{e}]")
    return musician_list


class Applicant:
    """
    Base class representing an applicant.
    
    Attributes:
    - surname (str): The surname of the applicant.
    """
    def __init__(self, surname):
        self._surname=surname
    
    @property
    def surname(self):
        return self._surname
    @surname.setter
    def surname(self,val):
        self._surname = val

class MusicianApplicant(Applicant):
    """
    Class representing a musician applicant, inheriting from Applicant.
    
    Attributes:
    - instrument (str): The instrument played by the musician.
    """
    def __init__(self, surname, instrument):
        super().__init__(surname)
        self._instrument = instrument
    
    @property
    def instrument(self):
        return self._instrument
    
    @instrument.setter
    def instrument(self, value):
        self._instrument=value

    def __lt__(self, other):
        return self.surname < other.surname
    
    def _to_string(self):
        return f"Surname: {self.surname}\nInstrument: {self.instrument}"
    