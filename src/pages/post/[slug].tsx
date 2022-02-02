import { GetStaticPaths, GetStaticProps } from 'next';

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';

import { FiCalendar,FiUser,FiClock } from "react-icons/fi";

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { RichText } from 'prismic-dom';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Comments from '../../components/Comments';
import PreviewButtom from '../../components/PreviewButton';
import Link from 'next/link';

interface Post {
  last_publication_date: string | null;
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface NeighborhoodPost {
  title: string;
  uid: string;
}

interface PostProps {
  post: Post;
  preview: boolean;
  nextPost: NeighborhoodPost;
  previousPost: NeighborhoodPost;
}

export default function Post({ 
  post, 
  preview,
  nextPost,
  previousPost  }: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  function handlingEditedTime() {
    if (post.last_publication_date === post.first_publication_date) {
      return null
    } else {
      return post.last_publication_date
    }
  }

  function averageReadingTime() {
    const totalWords = post.data.content.reduce((accWords, content) => {
      let postHeading = 0;
      let postBody = 0;

      if (content.heading) {
        postHeading = content.heading.trim().split(/\s+/).length;
      }

      if (RichText.asText(content.body)) {
        postBody = RichText.asText(content.body).trim().split(/\s+/).length;
      }

      return accWords + postHeading + postBody;
    }, 0)

    const wordsPerMinute = 200;

    return `${Math.ceil(totalWords / wordsPerMinute)} min`
  }
  
  return (
    <>
      <Head>
        <title>{post.data.title} | Space Traveling</title>
      </Head>

      <img className={styles.banner} src={post.data.banner.url} alt="banner" />
      <div className={styles.container}>

        <div className={styles.title}>{post.data.title}</div>

        <div className={styles.infos}>
          <FiCalendar className={styles.fiIcons} />
          <time>{format(
            new Date(post.first_publication_date),
            "d MMM y",
            {
              locale: ptBR,
            }
            )}
          </time>
          <FiUser className={styles.fiIcons} />
          <span>{post.data.author}</span>
          <FiClock className={styles.fiIcons} />
          <span>{averageReadingTime()}</span>
        </div>
        {handlingEditedTime() && (
          <div className={styles.editedTimeContainer}>
            <time className={styles.editedTime}>{format(
            new Date(handlingEditedTime()),
            "'* editado em 'd MMM y', às' 	HH':'mm",
            {
              locale: ptBR,
            }
            )}</time>
          </div>
        )}
        {post.data.content.map(({heading, body}) => (
          <div className={styles.conteudo} key={heading}>
            <strong>{heading}</strong>
            <div dangerouslySetInnerHTML={{ __html: RichText.asHtml(body) }}/>
          </div>
        ))} 

        <div className={styles.footer}>
          <div className={styles.navigationContainer}>

            {previousPost && (
              <div className={styles.previusContainer}>
                <p>{previousPost.title}</p>
                <Link href={`/post/${previousPost.uid}`}>
                  <a>Post anterior</a>
                </Link>
              </div>
            )}


            {nextPost && (
              <div className={styles.nextContainer}>
                <p>{nextPost.title}</p>
                <Link href={`/post/${nextPost.uid}`}>
                  <a>Próximo post</a>
                </Link>
              </div>
            )}  

          </div>
          <Comments />
        </div>

        {preview && <PreviewButtom />}

      </div> 
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ],{
    fetch: ['posts.title', 'post.subtitle', 'post.author'],
    pageSize: 3,
  });

  const paths = posts.results.map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths,
    fallback: true,
  }
};

function creatUnderlyingPost(post, slug): NeighborhoodPost | null {
  return slug === post.results[0].uid
    ? null
    : {
      title: post.results[0]?.data?.title,
      uid: post.results[0]?.uid,
    };
}

export const getStaticProps: GetStaticProps = async ({ params, preview = false, }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const responsePreviousPost = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    {
      pageSize: 1,
      after: slug,
      orderings: '[document.first_publication_date desc]',
    }
  );

  const responseNextPost = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    { pageSize: 1, after: slug, orderings: '[document.first_publication_date]' }
  );

  const nextPost = creatUnderlyingPost(responseNextPost, slug);
  const previousPost = creatUnderlyingPost(responsePreviousPost, slug);


  return {
    props: {
      post: response,
      preview,
      nextPost,
      previousPost,
    },
    revalidate: 60*30, // 24 horas
  }
};
