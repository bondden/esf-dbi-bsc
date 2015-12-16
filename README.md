# ESF DBIBsc Module

## Road map

| Version   | Functionality                                                                                         | Status   |
|---        |--                                                                                                     |---       |
| 0.1.0     | Basic single class ops. (req. [esf-dbi-bsc-0.1](esf-dbi-bsc-0.1), [esf-dbi-bsc-0.2](esf-dbi-bsc-0.2)) | released |
| 0.2.0     | FS archiving (req. [esf-dbi-bsc-0.4](esf-dbi-bsc-0.4))                                                | released |
| 0.3.0     | Batch ops (req. [esf-dbi-bsc-0.5](esf-dbi-bsc-0.5))                                                   |          |
| 0.4.0     | Record inserting (req. [esf-dbi-bsc-0.3](esf-dbi-bsc-0.3))                                            |          |
| 0.5.0     | FS restoring (req. [esf-dbi-bsc-0.6](esf-dbi-bsc-0.6))                                                |          |
| 0.6.0     | DB archiving (req. [esf-dbi-bsc-0.7](esf-dbi-bsc-0.7))                                                |          |
| 0.7.0     | DB restoring (req. [esf-dbi-bsc-0.8](esf-dbi-bsc-0.8))                                                |          |
| 1.0.0     | API v.1.0 (req. [esf-dbi-bsc-0.3](esf-dbi-bsc-0.3))                                                   |   _      |

## Requirements

### V. 1.0

| ReqId             | Requirement                                                    | Implementation Methods                |
|---                |---                                                             |---                                    |
| esf-dbi-bsc-0.1   | It should implement Graph API                                  |                                       |
| esf-dbi-bsc-0.1.1 | Every class should extend V or Basic                           |                                       |
| esf-dbi-bsc-0.2   | It run basic db operations: creating class from JS object, checking class existence, removing class | ```createClassIfNotExists```, ```classExists```, ```createClass``` |
| esf-dbi-bsc-0.3   | There should be a method to insert data to class               | ```insertRecords```                   |
| esf-dbi-bsc-0.3.1 | The method should accept either a recordData, or an array of recordData |                              |
| esf-dbi-bsc-0.4   | It should archive class to JSON file before dropping           | ```archiveClass```, ```dropClass```   |
| esf-dbi-bsc-0.5   | It run batch db operations: class creation, droppig, archiving | ```archiveClasses```, ```dropClasses```, ```createClasses``` |
| esf-dbi-bsc-0.6   | It should restore archived class from JSON file                | ```restoreClass```                    |
| esf-dbi-bsc-0.7   | It should archive class to DB file before dropping             | ```archiveClass```                    |
| esf-dbi-bsc-0.8   | It should restore class from DB                                | ```restoreClass```                    |
| itms-prc-psr-1.0  | It implement API v.1.0                                         |                    _                  |

## API v.1.0

```cs
object  db
Promise init(object cfg)
// single class operations
Promise createClassIfNotExists(object classData)
Promise classExists(string name)
Promise createClass(object classData)
Promise insertRecords(array records | object recordData)
Promise restoreClass(@rid archiveId)                     //archiveId is an archive fileName or @rid for FS and DB storage type respectively
Promise archiveClass(string name, string transactionId)  //transactionId defines version and optionally storage type: FS or DB
Promise dropClass(string name)
Promise truncateClass(string name)
// batch operations
Promise archiveClasses(array classNames)
Promise dropClasses(array classNames)
Promise createClasses(array data)
```
_____
&copy; ITMS 2009-2015
