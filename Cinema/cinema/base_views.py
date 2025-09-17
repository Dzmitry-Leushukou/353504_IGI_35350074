from .models import SponsorModel

def sponsors(request):
    sponsors = SponsorModel.objects.all()
    return {"sponsors": sponsors}
