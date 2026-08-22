<?php

namespace App\Console\Commands;

use App\Models\Project;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('docs:seed-templates {project : The project ID or slug}')]
#[Description('Seed default template docs for a project')]
class SeedDocTemplates extends Command
{
    public function handle(): int
    {
        $projectArg = $this->argument('project');

        $project = is_numeric($projectArg)
            ? Project::find($projectArg)
            : Project::where('slug', $projectArg)->first();

        if (! $project) {
            $this->error("Project not found: {$projectArg}");

            return self::FAILURE;
        }

        $existing = $project->docs()->count();
        if ($existing > 0) {
            $this->warn("Project already has {$existing} docs. Skipping.");

            return self::FAILURE;
        }

        $templates = [
            [
                'title' => 'Meeting Notes',
                'slug' => 'meeting-notes',
                'content' => $this->meetingNotesTemplate(),
                'sort_order' => 1,
            ],
            [
                'title' => 'Technical Specification',
                'slug' => 'technical-specification',
                'content' => $this->techSpecTemplate(),
                'sort_order' => 2,
            ],
            [
                'title' => 'Standard Operating Procedure',
                'slug' => 'standard-operating-procedure',
                'content' => $this->sopTemplate(),
                'sort_order' => 3,
            ],
        ];

        $user = $project->creator;

        if (! $user) {
            $this->error('Project has no creator to own the templates.');

            return self::FAILURE;
        }

        foreach ($templates as $template) {
            $doc = $project->docs()->create([
                'created_by' => $user->id,
                'title' => $template['title'],
                'slug' => $template['slug'],
                'content' => $template['content'],
                'sort_order' => $template['sort_order'],
            ]);
            $this->info("Created: {$doc->title} ({$doc->slug})");
        }

        $this->info('Done. Created '.count($templates)." template docs for project '{$project->name}'.");

        return self::SUCCESS;
    }

    private function meetingNotesTemplate(): string
    {
        return '<h1>Meeting Notes</h1>
<p><em>Use this template to document meeting outcomes and action items.</em></p>
<h2>Meeting Details</h2>
<ul>
<li><strong>Date:</strong> </li>
<li><strong>Attendees:</strong> </li>
<li><strong>Facilitator:</strong> </li>
<li><strong>Note-taker:</strong> </li>
</ul>
<h2>Agenda</h2>
<ol>
<li>Item 1</li>
<li>Item 2</li>
<li>Item 3</li>
</ol>
<h2>Discussion Notes</h2>
<p>Record key points discussed here.</p>
<h2>Decisions Made</h2>
<ul>
<li>Decision 1</li>
</ul>
<h2>Action Items</h2>
<table>
<thead>
<tr>
<th>Action</th>
<th>Owner</th>
<th>Due Date</th>
<th>Status</th>
</tr>
</thead>
<tbody>
<tr>
<td></td>
<td></td>
<td></td>
<td>Pending</td>
</tr>
</tbody>
</table>';
    }

    private function techSpecTemplate(): string
    {
        return '<h1>Technical Specification</h1>
<p><em>Use this template to document technical design and implementation details.</em></p>
<h2>Overview</h2>
<p>Brief description of the feature or system.</p>
<h2>Goals</h2>
<ul>
<li>Goal 1</li>
<li>Goal 2</li>
</ul>
<h2>Non-Goals</h2>
<ul>
<li>What this spec does NOT cover</li>
</ul>
<h2>Background</h2>
<p>Why is this needed? What problem does it solve?</p>
<h2>Detailed Design</h2>
<h3>Architecture</h3>
<p>Describe the system architecture.</p>
<h3>Data Model</h3>
<p>Database schema changes, new models.</p>
<h3>API Design</h3>
<p>Endpoint specifications if applicable.</p>
<h3>User Flows</h3>
<p>How users interact with this feature.</p>
<h2>Alternatives Considered</h2>
<p>Other approaches that were evaluated and why they were not chosen.</p>
<h2>Dependencies</h2>
<ul>
<li>External services or libraries</li>
</ul>
<h2>Risks &amp; Mitigations</h2>
<table>
<thead>
<tr>
<th>Risk</th>
<th>Mitigation</th>
</tr>
</thead>
<tbody>
<tr>
<td></td>
<td></td>
</tr>
</tbody>
</table>';
    }

    private function sopTemplate(): string
    {
        return '<h1>Standard Operating Procedure</h1>
<p><em>Document a repeatable process for your team.</em></p>
<h2>Purpose</h2>
<p>Why does this SOP exist? What problem does it solve?</p>
<h2>Scope</h2>
<p>Who does this apply to? When should this SOP be followed?</p>
<h2>Prerequisites</h2>
<ul>
<li>Requirement 1</li>
<li>Requirement 2</li>
</ul>
<h2>Procedure</h2>
<ol>
<li><strong>Step 1:</strong> Description of the first step</li>
<li><strong>Step 2:</strong> Description of the second step</li>
<li><strong>Step 3:</strong> Description of the third step</li>
</ol>
<h2>Decision Points</h2>
<p>Describe any branching logic or decision points.</p>
<h2>Expected Outcomes</h2>
<p>What should happen after completing this SOP?</p>
<h2>Troubleshooting</h2>
<table>
<thead>
<tr>
<th>Problem</th>
<th>Solution</th>
</tr>
</thead>
<tbody>
<tr>
<td></td>
<td></td>
</tr>
</tbody>
</table>
<h2>Change Log</h2>
<ul>
<li><strong>v1.0</strong> — Initial version</li>
</ul>';
    }
}
