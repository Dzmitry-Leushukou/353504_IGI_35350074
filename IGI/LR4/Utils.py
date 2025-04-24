class utils:
    """
    Utility class for helper functions related to musician applicants.

    Methods:
    - sort_applicants(musicians): Sorts a list of musician applicants in ascending order.
    """
    @staticmethod
    def sort_applicants(musicians):
        """
        Sorts a list of musician applicants.

        Parameters:
        - musicians (list): A list of musician applicant objects that implement the comparison methods.

        This method sorts the musicians list in place using their natural order (based on the 
        __lt__ method defined in the MusicianApplicant class).
        """
        musicians.sort()