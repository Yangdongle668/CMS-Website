<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Product Inquiry</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #0066cc; color: white; padding: 20px; text-align: center; border-radius: 5px;">
            <h1 style="margin: 0;">New Product Inquiry</h1>
        </div>

        <div style="background-color: #f5f5f5; padding: 20px; margin-top: 20px; border-radius: 5px;">
            <h2 style="color: #0066cc;">Customer Information</h2>
            <p>
                <strong>Name:</strong> {{ $inquiry->name }}<br>
                <strong>Email:</strong> <a href="mailto:{{ $inquiry->email }}">{{ $inquiry->email }}</a><br>
            </p>

            @if($inquiry->product)
                <h2 style="color: #0066cc;">Product of Interest</h2>
                <p>
                    <strong>Product:</strong> {{ $inquiry->product->name }}<br>
                    @if($inquiry->product->model)
                        <strong>Model:</strong> {{ $inquiry->product->model }}<br>
                    @endif
                    @if($inquiry->product->capacity)
                        <strong>Capacity:</strong> {{ $inquiry->product->capacity }} mAh<br>
                    @endif
                </p>
            @endif

            <h2 style="color: #0066cc;">Message</h2>
            <p style="white-space: pre-wrap; background-color: white; padding: 15px; border-left: 4px solid #0066cc;">{{ $inquiry->message }}</p>
        </div>

        <div style="margin-top: 20px; padding: 20px; background-color: #f0f0f0; border-radius: 5px;">
            <h3>Next Steps</h3>
            <p>
                Please reply to this email or contact the customer directly to follow up on this inquiry.
            </p>
            <p>
                <a href="{{ url('/admin') }}" style="color: #0066cc; text-decoration: none;">
                    <button style="background-color: #0066cc; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
                        View in Admin Panel
                    </button>
                </a>
            </p>
        </div>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

        <footer style="text-align: center; color: #999; font-size: 12px;">
            <p>
                Raven Battery B2B Portal<br>
                This is an automated email. Please do not reply directly to this email address.
            </p>
        </footer>
    </div>
</body>
</html>
