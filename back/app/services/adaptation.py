def compute_readiness_score(
    sleep_hours: float,
    fatigue: int,
    stress: int,
    soreness: int,
    pain_level: int,
) -> int:
    sleep_score = max(0, min(100, int((sleep_hours / 8.0) * 100)))
    strain_penalty = (fatigue + stress + soreness + pain_level) * 8
    score = sleep_score - strain_penalty + 40
    return max(0, min(100, score))


def suggest_intensity(base_intensity: int, readiness_score: int, pain_level: int) -> int:
    if pain_level >= 7:
        return max(1, int(base_intensity * 0.5))
    if readiness_score >= 75:
        return min(10, int(base_intensity * 1.1))
    if readiness_score >= 50:
        return base_intensity
    if readiness_score >= 30:
        return max(1, int(base_intensity * 0.8))
    return max(1, int(base_intensity * 0.6))


def build_advice(readiness_score: int, pain_level: int) -> str:
    if pain_level >= 7:
        return "Douleur elevee detectee: reduis fortement l'intensite et privilegie mobilite/recuperation."
    if readiness_score >= 75:
        return "Excellente forme du jour: tu peux maintenir ou augmenter legerement la charge."
    if readiness_score >= 50:
        return "Etat correct: suis la seance planifiee avec un echauffement soigne."
    if readiness_score >= 30:
        return "Fatigue perceptible: reduis l'intensite et focalise la technique."
    return "Risque de surmenage: seance legere conseillee, priorite a la recuperation."
