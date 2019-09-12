# watson-vr-node
IBM Watson Visual Recognitionを使ったnode.jsの画像認識Webアプリです。

>2019/09/13: Detect Faces のメソッドが削除されたため、取り急ぎ顔認証部分のUIはコメントアウトして表示しないように変更しました。

## 1. 事前準備
### 1. IBM Cloudのアカウントを取得
お持ちでないかたは [こちら](https://cloud.ibm.com/registration?cm_mmc=Email_Events-_-Developer_Innovation-_-WW_WW-_-nishito\tokyo\japan&cm_mmca1=000019RS&cm_mmca2=10004805&cm_mmca3=M99938765&cvosrc=email.Events.M99938765&cvo_campaign=000019RS
)から取得お願いします。

取得方法の動画はこちらです: https://youtu.be/Krn1jQ4iy_s

### 2. IBM CloudのCLIをインストール
### 2-1)  
https://cloud.ibm.com/docs/cli/reference/ibmcloud?topic=cloud-cli-install-ibmcloud-cli#install_use  にアクセスし、"スタンドアロン IBM Cloud CLI のインストール"に従い、①、②、③、④をご利用されているOSに合わせて実行してください。(windowsは再起動が必要です)


### 2-2)  以下のコマンドを実行し、必要なツールのインストールが完了しているか検証を行ってください。
出力例のようにバージョン情報が出力されればOKです
```
ibmcloud --version
```

出力例：
```
ibmcloud version 0.7.1+8a6d40e-2018-06-07T07:13:39+00:00
```

### 2-3) CLIでIBM Cloudにログインできるか確認
ターミナルやコマンドプロンプトを利用し以下のコマンドを実行しログインできることを確認します。

```
ibmcloud login -r us-south
```
作成したアカウントのメールアドレスやパスワードを入力しログインしてください
ログインが正常に行えればOkです。


出力例：
```
API endpoint:       https://api.ng.bluemix.net
Region:                  us-south
User:                      XXXXXX@hoge.com
Account:                XXXXX's Account (xxxxxxxxxxxxxxxxxxxxx)
Resource group:    default
CF API endpoint:   https://api.ng.bluemix.net (API version: 2.92.0)
Org:                        XXXXXX@hoge.com
Space:                    dev
OK
```



## 2. Visual Recognition サービスの作成
Visual Recognition サービスを作成していない場合は、作成します。既に作成済みであれば、作成済みのものを使用できます。

>画面イメージのある手順を参照したい場合は[Watson APIを使うための前準備: サービスの作成と資格情報の取得](https://qiita.com/nishikyon/items/9b8f697db7ad0a693839)の[1. Watson サービスの作成](https://qiita.com/nishikyon/items/9b8f697db7ad0a693839#1-watson-%E3%82%B5%E3%83%BC%E3%83%93%E3%82%B9%E3%81%AE%E4%BD%9C%E6%88%90)を参照して下さい (`2. サービスの資格情報取得`は実施不要です)。以下の`6. (オプション) カスタム分類クラスの作成` はその後に実施ください。

1. https://cloud.ibm.com/login よりIBM Cloudにログイン

2. 表示された「ダッシュボード」の上部のメニュー「カタログ」をクリック

3. 表示された「カタログ」の上部の検索フィールドに`Visual Recognition`と入力し、「検索」ボタンをクリック。

4. 表示された AIカテゴリの`Visual Recognition`をクリック。

5. `Visual Recognition`サービス作成の画面が表示されるので、右側のの'作成'をクリックして、サービスを作成する。

6. (オプション) カスタム分類クラスの作成

自分の写真で分類クラスを作成したい場合は実施してください。
>こちらは省略可能です。省略した場合はIBMが提供する食品に特化した分類クラス`food`を使用します。

[Watson Visual Recognition カスタムクラスを作ろう!](https://qiita.com/nishikyon/items/7d1c07e2f50c1002e815)を参照してカスタム分類クラスの作成を行ってください。
[10. トレーニング開始](https://qiita.com/nishikyon/items/7d1c07e2f50c1002e815#10-%E3%83%88%E3%83%AC%E3%83%BC%E3%83%8B%E3%83%B3%E3%82%B0%E9%96%8B%E5%A7%8B)まで実施お願いします。


## 3. アプリケーションのClone
下記のコマンドを実行しアプリケーションのコードをGitHubのリポジトリからクローンします。
```
git clone https://github.com/kyokonishito/watson-vr-node.git
```
クローンが完了したら以下のコマンドを入力してください。
```
cd watson-vr-node
```

## 4. アプリケーションのIBM Cloudへのデプロイ
> Local PCで動作させる方法は後日記載予定です。
### 1. `manifest.yml`の編集
watson-vr-nodeフォルダにある`manifest.yml`を2箇所変更して保存します。
#### 1-1) 3行目　<Set Your Application Name>
ご自分のアプリケーション名に変更します。アプリケーション名はURLの先頭部分となるため、bluemix.net内でユニークな値である必要があります。
自分のIBM CloudのID等と組みわせて、ユニークになるような名前にしてください。前後の`<>`は不要です。<br/>
例: 
```
- name: myid-watson-vr
````

#### 1-2) 8行目　<Set Your CLASSIFIER_ID>
Visual RecognitionのカスタムクラスのIDを記入します。

2で[Watson Visual Recognition カスタムクラスを作ろう!](https://qiita.com/nishikyon/items/7d1c07e2f50c1002e815)を参照してカスタムクラスを作成した場合は、
[11. モデルの表示](https://qiita.com/nishikyon/items/7d1c07e2f50c1002e815#11-%E3%83%A2%E3%83%87%E3%83%AB%E3%81%AE%E8%A1%A8%E7%A4%BA) と[12. Classifier IDの取得](https://qiita.com/nishikyon/items/7d1c07e2f50c1002e815#12-classifier-id%E3%81%AE%E5%8F%96%E5%BE%97)の手順に従い、Classifier IDをコピーしペーストします。


カスタムクラスを作成していない場合は、IBMが提供している食物に特化したカスタムクラスのid,`food`を記入します。前後の`<>`は不要です。<br/>
例　カスタムクラスを作成した場合: 
```
env:
    CLASSIFIER_ID: DefaultCustomModel_1941703287
````

例　カスタムクラスを作成していない場合: 
```
env:
    CLASSIFIER_ID: food
````

全体例:
```
---
applications:
- name: myid-watson-vr
  buildpacks:
    - nodejs_buildpack
  command: node -max_old_space_size=2048 app.js
  env:
    CLASSIFIER_ID: food
  memory: 256M
```

### 2. IBM Cloudへの ログイン
以下のコマンドを入力してください。
```
ibmcloud login -r us-south
```
作成したアカウントのメールアドレスやパスワードを入力しログインしてください。

次に以下のコマンドを入力してください。
```
ibmcloud target --cf
```
### 3. IBM Cloudへの アプリケーションのアップロード
アプリケーションをIBM Cloudへアップロードします。以下のコマンドを入力してください。
```
ibmcloud cf push --no-start
```
Visual Recognitionとのバインドが済んでいないため、開始するとエラーになるため、`--no-start`オプションで開始しないようにしています。

## 5. Visual Recognition サービスのバインドとアプリケーションの開始

IBM CloudのCloud Foundry アプリケーションと　IBM Cloud上のサービスを接続(bind)すると、資格情報や接続情報が連携され、個別に設定する必要がなくなります。

> 画面イメージのある手順を参照したい場合は[IBM Cloud: Cloud Foundry アプリケーションとサービスの接続](https://qiita.com/nishikyon/items/0e21fdabcd7f8966bb24)を参照して下さい

1. https://cloud.ibm.com/login よりIBM Cloudにログイン

2. 表示されたダッシュボードの[リソースの要約]から`リソースの表示`をクリックする。

3. `Cloud Foundry Apps`の文字をクリックする。

4. `4. アプリケーションのIBM Cloudへのデプロイ`の` 1. manifest.ymlの編集`で設定したアプリケーション名が表示されているので、そのアプリケーション名をクリックする。

5. 左のメニューから`接続`をクリックする。

6. `「接続の作成」`ボタンをクリックする。

7.  表示された `Visual Recognition`のサービスの行にマウスポインターを乗せると、右側に`「接続」`ボタンが表示される。表示された`「接続」`をクリックする。

8. `IAM対応サービスのの接続`というウィンドウが表示されるので、デフォルト値ののまま、`「接続」`ボタンをクリックする。

9. `アプリの再ステージ`というウィンドウが表示されるので、`「再ステージ」`ボタンをクリックする。

10. 再ステージが完了したら、経路ボタンの右にある縦三つの点(・・・)のメニューをクリックし、`開始`をクリックする。

## 6. アプリケーションの動作確認
1. アプリケーションが稼働中になったら、`アプリ URL にアクセス`をクリックする。
アプリケーションの画面が表示されます。
`「ファイルの選択」`から写真を選んだ後、各青ボタンをクリックして、Visual Recognitionの結果を確認します。

- Watsonで認識（Watson学習済みモデルを利用):
  -W atsonが写真を認識した内容を表示します。

- Watsonで認識（カスタムモデルを利用):
  - カスタムモデル認識したクラスを表示します。

2.　スマートフォンでの確認
一番下にQRコードが表示されているので、それをスマートフォンのカメラで読んでUアプリケーションのRLにアクセすると、スマートフォンでも結果を確認できます。スマートフォンでは`「ファイルの選択」`ボタンでその場で撮った写真も認識可能です。

>URLは　＜アプリケーション名＞.mybluemix.net　となります。



