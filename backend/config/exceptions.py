from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):

    response = exception_handler(exc, context)

    if response is None:
        return None

    data = response.data

    if isinstance(data, dict):
        formatted_data = {}

        for field, messages in data.items():
            if isinstance(messages, list):
                formatted_data[field] = [str(message) for message in messages]
            else:
                formatted_data[field] = [str(messages)]

        response.data = formatted_data

    else:
        response.data = {'detail': [str(data)]}

    return response