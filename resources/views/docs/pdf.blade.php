<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $doc->title }}</title>
    <style>
        body { font-family: Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.6; color: #1a1a1a; max-width: 700px; margin: 0 auto; padding: 40px; }
        h1 { font-size: 22px; margin-bottom: 8px; }
        h2 { font-size: 17px; margin-top: 24px; margin-bottom: 8px; }
        h3 { font-size: 15px; margin-top: 20px; }
        p { margin: 8px 0; }
        ul, ol { margin: 8px 0; padding-left: 24px; }
        li { margin: 4px 0; }
        table { border-collapse: collapse; width: 100%; margin: 12px 0; }
        th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; }
        th { background: #f5f5f5; }
        hr { border: none; border-top: 1px solid #ccc; margin: 24px 0; }
        .meta { color: #666; font-size: 11px; margin-bottom: 24px; }
        strong { font-weight: 600; }
        a { color: #2563eb; }
    </style>
</head>
<body>
    <h1>{{ $doc->title }}</h1>
    <div class="meta">
        Project: {{ $project->name }} &middot;
        @if($doc->author)Author: {{ $doc->author->name }} &middot;@endif
        Updated: {{ $doc->updated_at->format('M j, Y') }}
    </div>
    <hr>
    {!! $doc->content !!}
</body>
</html>
