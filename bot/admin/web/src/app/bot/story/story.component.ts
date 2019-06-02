import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChange, SimpleChanges} from "@angular/core";
import {
  AnswerConfigurationType,
  CreateStoryRequest,
  IntentName,
  StoryDefinitionConfiguration,
  StoryStep
} from "../model/story";
import {BotService} from "../bot-service";
import {MatDialog, MatSnackBar} from "@angular/material";
import {StateService} from "../../core-nlp/state.service";
import {ConfirmDialogComponent} from "../../shared-nlp/confirm-dialog/confirm-dialog.component";
import {StoryDialogComponent} from "./story-dialog.component";
import {MandatoryEntitiesDialogComponent} from "./mandatory-entities-dialog.component";
import {StoryNode} from "../flow/node";
import {StepDialogComponent} from "./step-dialog.component";
import {AnswerController} from "./controller";

@Component({
  selector: 'tock-story',
  templateUrl: './story.component.html',
  styleUrls: ['./story.component.css']
})
export class StoryComponent implements OnInit, OnChanges {

  @Input()
  story: StoryDefinitionConfiguration = null;

  @Input()
  storyNode: StoryNode = null;

  @Input()
  fullDisplay: boolean = false;

  @Input()
  displaySteps: boolean = false;

  @Input()
  botId: string = null;

  @Input()
  displayCancel: boolean = false;

  @Output()
  delete = new EventEmitter<string>();

  @Input()
  submit = new AnswerController();

  constructor(private state: StateService,
              private bot: BotService,
              private dialog: MatDialog,
              private snackBar: MatSnackBar) {
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.storyNode) {
      const c = (changes.storyNode as SimpleChange).currentValue;
      if (!c) {
        this.story = null;
      } else if (c.dynamic) {
        this.bot.findStory(this.storyNode.storyDefinitionId)
          .subscribe(s => {
            //explicit null value if no story found
            this.story = s.storyId ? s : null;
          });
      } else {
        this.initStoryByBotIdAndIntent();
      }
    }
  }

  private initStoryByBotIdAndIntent() {
    this.bot.findStoryByBotIdAndIntent(this.botId, this.storyNode.storyDefinitionId)
      .subscribe(s => {
        //explicit null value if no story found
        this.story = s.storyId ? s : null;
      });
  }

  deleteStory() {
    let dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `Delete the story ${this.story.name}`,
        subtitle: "Are you sure?",
        action: "Remove"
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === "remove") {
        this.bot.deleteStory(this.story._id)
          .subscribe(_ => {
            this.delete.emit(this.story._id);
            this.story = null;
            this.snackBar.open(`Story deleted`, "Delete", {duration: 2000})
          });
      }
    });
  }

  editStory() {
    let dialogRef = this.dialog.open(
      StoryDialogComponent,
      {
        data:
          {
            create: !this.story._id,
            name: this.story.storyId,
            label: this.story.name,
            intent: this.story.intent.name,
            description: this.story.description,
            category: this.story.category,
            freezeIntent: this.storyNode,
            userSentence: this.story.userSentence,
            story: this.story
          }
      }
    );
    dialogRef.afterClosed().subscribe(result => {
      if (result.name) {
        this.story.storyId = result.name;
        this.story.name = result.label;
        this.story.intent.name = result.intent;
        this.story.category = result.category;
        this.story.description = result.description;
        this.story.userSentence = result.userSentence;
        this.saveStory();
      }
    });
  }

  private saveStory() {
    this.story.steps = StoryStep.filterNew(this.story.steps);
    if (this.story._id) {
      this.bot.saveStory(this.story).subscribe(s => {
        this.state.resetConfiguration();
        this.snackBar.open(`Story ${this.story.name} modified`, "Update", {duration: 3000});
      })
    }
  }

  editEntities() {
    let dialogRef = this.dialog.open(
      MandatoryEntitiesDialogComponent,
      {
        data:
          {
            entities: this.story.mandatoryEntities,
            category: this.story.category
          }
      }
    );
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.entities) {
        this.story.mandatoryEntities = result.entities;
        this.saveStory();
      }
    });
  }

  editSteps() {
    let dialogRef = this.dialog.open(
      StepDialogComponent,
      {
        data:
          {
            steps: this.story.steps,
            category: this.story.category
          },
        minWidth: 900
      }
    );
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.steps) {
        this.story.steps = result.steps;
        this.saveStory();
      }
    });
  }

  createStory() {
    const intent = this.state.findIntentByName(this.storyNode.storyDefinitionId);
    this.story = new StoryDefinitionConfiguration(
      intent.name,
      this.botId,
      new IntentName(intent.name),
      AnswerConfigurationType.simple,
      this.state.user.organization,
      [],
      "build",
      intent.name
    );
  }

  saveNewStory() {
    let invalidMessage = this.story.currentAnswer().invalidMessage();
    if (invalidMessage) {
      this.snackBar.open(`Error: ${invalidMessage}`, "ERROR", {duration: 5000});
    } else {
      this.bot.newStory(
        new CreateStoryRequest(
          this.story,
          this.state.currentLocale,
          []
        )
      ).subscribe(intent => {
        this.snackBar.open(`New story ${this.story.name} created for language ${this.state.currentLocale}`, "New Story", {duration: 3000});
        this.initStoryByBotIdAndIntent();
      });
    }
  }

}